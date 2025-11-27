from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api")

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/items/{item_id}")
async def read_item(item_id: int):
    # простой пример
    if item_id <= 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"id": item_id, "name": f"Item {item_id}"}
