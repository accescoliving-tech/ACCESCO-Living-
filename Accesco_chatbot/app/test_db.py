from sqlalchemy import create_engine, text
from config import settings

def test_db_connection():
    try:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
        )

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            print("Result:", result.scalar())

    except Exception as e:
        print("DB_HOST =", settings.DB_HOST)
        print("DB_USER =", settings.DB_USER)
        print("DB_PASSWORD =", settings.DB_PASSWORD)
        print("DB_PORT =", settings.DB_PORT)
        print("DB_NAME =", settings.DB_NAME)

        print("❌ Database connection failed")
        print(e)

if __name__ == "__main__":
    test_db_connection()
