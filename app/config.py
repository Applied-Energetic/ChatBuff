import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 基础配置
    PROJECT_NAME: str = "ChatBuff"
    VERSION: str = "0.1.0"
    
    # LLM 配置 (对应 .env 文件)
    LLM_PROVIDER: str = "deepseek"
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str = "https://api.deepseek.com/v1"
    LLM_MODEL_NAME: str = "deepseek-chat"

    # 数据库配置 (后续使用)
    # CHROMA_DB_PATH: str = "./chroma_db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # 忽略 .env 中多余的字段

# 单例模式实例化
settings = Settings()
