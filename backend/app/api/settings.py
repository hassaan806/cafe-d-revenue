from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os

from ..api.auth import get_current_user
from ..models.user import User
from ..utils.sms import sms_service

# Pydantic models
class SMSSettings(BaseModel):
    enabled: bool = False
    provider: str = "generic"
    apiKey: str = ""
    senderId: str = ""
    
    class Config:
        # Allow mapping from snake_case to camelCase
        alias_generator = lambda x: x
        allow_population_by_field_name = True

class SMSMessage(BaseModel):
    phone: str
    message: str

class BulkSMSMessage(BaseModel):
    messages: List[Dict[str, Any]]

router = APIRouter()

# Settings file path
SETTINGS_FILE = "sms_settings.json"

def load_sms_settings() -> SMSSettings:
    """Load SMS settings from file"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
                return SMSSettings(**data)
        except Exception as e:
            print(f"Error loading SMS settings: {e}")
            return SMSSettings()
    return SMSSettings()

def save_sms_settings(settings: SMSSettings):
    """Save SMS settings to file"""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings.dict(by_alias=True), f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving SMS settings: {str(e)}")

@router.get("/sms", response_model=SMSSettings)
async def get_sms_settings(current_user: User = Depends(get_current_user)):
    """Get SMS settings (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can access SMS settings")
    
    return load_sms_settings()

@router.put("/sms", response_model=SMSSettings)
async def update_sms_settings(
    settings: SMSSettings,
    current_user: User = Depends(get_current_user)
):
    """Update SMS settings (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update SMS settings")
    
    # Configure the global SMS service with new settings
    if settings.enabled and settings.apiKey and settings.senderId:
        sms_service.configure(settings.apiKey, settings.senderId)
    
    save_sms_settings(settings)
    return settings

@router.post("/sms/test", response_model=bool)
async def send_test_sms(
    message: SMSMessage,
    current_user: User = Depends(get_current_user)
):
    """Send test SMS (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can send test SMS")
    
    sms_settings = load_sms_settings()
    
    if not sms_settings.enabled:
        raise HTTPException(status_code=400, detail="SMS is not enabled")
    
    if not sms_settings.apiKey or not sms_settings.senderId:
        raise HTTPException(status_code=400, detail="SMS API key and sender ID are required")
    
    # Configure SMS service with current settings for test
    sms_service.configure(sms_settings.apiKey, sms_settings.senderId)
    
    # Send actual SMS using the SMS service
    try:
        result = sms_service.send_sms(message.phone, message.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

@router.post("/sms/test-bulk", response_model=bool)
async def send_test_bulk_sms(
    bulk_message: BulkSMSMessage,
    current_user: User = Depends(get_current_user)
):
    """Send test bulk SMS (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can send test bulk SMS")
    
    sms_settings = load_sms_settings()
    
    if not sms_settings.enabled:
        raise HTTPException(status_code=400, detail="SMS is not enabled")
    
    if not sms_settings.apiKey or not sms_settings.senderId:
        raise HTTPException(status_code=400, detail="SMS API key and sender ID are required")
    
    # Configure SMS service with current settings for test
    sms_service.configure(sms_settings.apiKey, sms_settings.senderId)
    
    # Send actual bulk SMS using the SMS service
    try:
        result = sms_service.send_bulk_sms(bulk_message.messages)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send bulk SMS: {str(e)}")