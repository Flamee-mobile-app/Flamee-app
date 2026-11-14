from typing import Annotated

from fastapi import APIRouter,Depends,Header,Query

from app.api.deps import get_current_user,get_db
from app.api.response import ok
from app.repositories.reward_repo import RewardRepository
from app.schemas.reward import RewardInput,RewardUpdate,RedemptionInput,FulfillmentInput,MissionRulesInput
from app.services.reward_service import RewardService

router=APIRouter(tags=['rewards'])
RequestKey=Annotated[str,Header(alias='Idempotency-Key',min_length=1,max_length=120,pattern=r'^[A-Za-z0-9_-]+$')]


def service(db):return RewardService(RewardRepository(db))


@router.get('/rewards')
def catalog(limit:int=Query(20,ge=1,le=100),offset:int=Query(0,ge=0),current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'catalog',payload={'limit':limit,'offset':offset}))


@router.post('/redemptions',status_code=201)
def redeem(payload:RedemptionInput,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'redeem',payload.reward_id,key,{'expected_price':payload.expected_price}))


@router.get('/redemptions')
def orders(limit:int=Query(20,ge=1,le=100),offset:int=Query(0,ge=0),current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'list',payload={'limit':limit,'offset':offset}))


@router.get('/redemptions/{redemption_id}')
def order(redemption_id:str,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'get',redemption_id))


@router.post('/redemptions/{redemption_id}/cancel')
def cancel(redemption_id:str,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'cancel',redemption_id,key))


@router.get('/operator/rewards')
def operator_catalog(current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_catalog'))


@router.post('/operator/rewards',status_code=201)
def create_reward(payload:RewardInput,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_create',key=key,payload=payload.model_dump(mode='json')))


@router.put('/operator/rewards/{reward_id}')
def update_reward(reward_id:str,payload:RewardUpdate,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_update',reward_id,key,payload.model_dump(mode='json')))


@router.get('/operator/redemptions')
def operator_orders(current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_list'))


@router.post('/operator/redemptions/{redemption_id}/fulfill')
def fulfill(redemption_id:str,payload:FulfillmentInput,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_fulfill',redemption_id,key,payload.model_dump(mode='json')))


@router.get('/operator/missions/rules')
def rules(current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_rules'))


@router.post('/operator/missions/rules',status_code=201)
def configure_rules(payload:MissionRulesInput,key:RequestKey,current:dict=Depends(get_current_user),db=Depends(get_db)):
    return ok(service(db).run(current['id'],'admin_rules_create',key=key,payload=payload.model_dump()))
