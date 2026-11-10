from fastapi import APIRouter, Depends, Header, Query

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.repositories.mission_repo import MissionRepository
from app.schemas.mission import MissionChangeRequest, MissionTimezoneRequest
from app.services.mission_service import MissionService

router = APIRouter(tags=['missions'])


def service(db):
    return MissionService(MissionRepository(db))


@router.get('/missions/today')
def today(current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).read(current['id'], 'today'))


@router.get('/missions/achievements')
def achievements(current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).read(current['id'], 'achievements'))


@router.get('/wallet')
def wallet(current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).read(current['id'], 'wallet'))


@router.get('/wallet/ledger')
def ledger(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0),
    current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).read(current['id'], 'ledger', limit=limit, offset=offset))


@router.post('/missions/{mission_id}/complete')
def complete(mission_id: str, payload: MissionChangeRequest,
    key: str = Header(alias='Idempotency-Key', min_length=1,max_length=120,pattern=r'^[A-Za-z0-9_-]+$'),
    current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).change(current['id'], 'complete', mission_id, key, payload.model_dump()))


@router.post('/missions/{mission_id}/swap')
def swap(mission_id: str, payload: MissionChangeRequest,
    key: str = Header(alias='Idempotency-Key',min_length=1,max_length=120,pattern=r'^[A-Za-z0-9_-]+$'),
    current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).change(current['id'], 'swap', mission_id, key, payload.model_dump()))


@router.put('/missions/timezone')
def timezone(payload: MissionTimezoneRequest,
    key: str = Header(alias='Idempotency-Key',min_length=1,max_length=120,pattern=r'^[A-Za-z0-9_-]+$'),
    current: dict = Depends(get_current_user), db=Depends(get_db)):
    return ok(service(db).change(current['id'], 'timezone', None, key, payload.model_dump()))
