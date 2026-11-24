from unittest.mock import Mock

from app.repositories.reward_repo import RewardRepository

CATALOG={'title_vi':'Unit fixture','title_en':'Unit fixture','price_points':100,'stock':1,'fanpage_url':'https://example.invalid/unit-only'}


def test_operator_role_is_server_owned_and_cannot_be_forged(client,alice_headers,monkeypatch):
    operation=Mock(return_value=[])
    monkeypatch.setattr(RewardRepository,'execute',operation)
    assert client.get('/api/v1/operator/rewards',headers={**alice_headers,'X-Role':'admin'}).status_code==403
    assert client.post('/api/v1/operator/rewards',headers={**alice_headers,'Idempotency-Key':'create'},json=CATALOG).status_code==403
    operation.assert_not_called()


def test_rewards_require_key_quote_and_no_forged_actor(client,alice_headers,monkeypatch):
    actor=client.get('/api/v1/auth/me',headers=alice_headers).json()['data']['id']
    operation=Mock(return_value={'id':'order','couple_id':'pair','status':'pending_fulfillment'})
    monkeypatch.setattr(RewardRepository,'execute',operation)
    path='/api/v1/redemptions'
    body={'reward_id':'reward','expected_price':100}
    assert client.post(path,headers=alice_headers,json=body).status_code==422
    headers={**alice_headers,'Idempotency-Key':'stable'}
    assert client.post(path,headers=headers,json={**body,'actor_id':'other'}).status_code==422
    assert client.post(path,headers=headers,json={**body,'expected_price':-1}).status_code==422
    assert client.post(path,headers=headers,json={**body,'expected_price':99}).status_code==422
    assert client.post(path,headers=headers,json=body).status_code==201
    operation.assert_called_once_with(actor,'redeem','reward','stable',{'expected_price':100})


def test_operator_catalog_url_and_fulfillment_validation(client,alice_headers):
    headers={**alice_headers,'Idempotency-Key':'stable'}
    for url in ('javascript:alert(1)','http://example.invalid','https://user:password@example.invalid'):
        assert client.post('/api/v1/operator/rewards',headers=headers,json={**CATALOG,'fanpage_url':url}).status_code==422
    assert client.post('/api/v1/operator/redemptions/order/fulfill',headers=headers,json={'status':'shipped'}).status_code==422


def test_reward_config_allows_missing_fanpage_but_requires_minimum_points():
    import pytest
    from pydantic import ValidationError
    from app.schemas.reward import RewardInput
    without_link={key:value for key,value in CATALOG.items() if key!='fanpage_url'}
    assert RewardInput(**without_link).fanpage_url is None
    with pytest.raises(ValidationError):
        RewardInput(**{**without_link,'price_points':99})


def test_reward_service_rejects_below_minimum_before_any_point_write():
    import pytest
    from app.core.exceptions import ValidationError
    from app.services.reward_service import RewardService
    repository=Mock()
    with pytest.raises(ValidationError):
        RewardService(repository).run('user','redeem','reward','key',{'expected_price':99})
    repository.execute.assert_not_called()
