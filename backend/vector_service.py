import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List, Dict, Any

class VectorService:
    def __init__(self, db_path: str = "./vector_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        # OpenAI 임베딩 함수 설정 (환경 변수 사용)
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            os.environ["CHROMA_OPENAI_API_KEY"] = api_key
            
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=api_key,
            model_name="text-embedding-3-small"
        )
        self.collection_name = "chat_history"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.openai_ef
        )

    def add_message(self, char_id: str, message_id: str, role: str, content: str, metadata: Dict[str, Any] = None):
        """메시지를 벡터 데이터베이스에 추가합니다."""
        if not metadata:
            metadata = {}
        
        metadata.update({
            "char_id": char_id,
            "role": role,
            "message_id": message_id
        })
        
        self.collection.upsert(
            ids=[message_id],
            documents=[content],
            metadatas=[metadata]
        )

    def query_similar_messages(self, char_id: str, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """현재 쿼리와 가장 유사한 과거 대화 내용을 검색합니다."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"char_id": char_id}
        )
        
        processed_results = []
        if results and results['documents']:
            for i in range(len(results['documents'][0])):
                processed_results.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i]
                })
        return processed_results

    def migrate_from_json(self, chats_data: Dict[str, Any]):
        """기존 JSON 데이터를 벡터 DB로 마이그레이션합니다."""
        # 1. 현재 컬렉션에 있는 모든 ID를 한꺼번에 가져와 처리 속도 향상
        try:
            # 대규모 데이터의 경우 get()이 무거울 수 있으나, 초기에는 효과적
            existing_ids = set(self.collection.get()["ids"])
        except:
            existing_ids = set()

        for storage_id, chat_data in chats_data.items():
            messages = chat_data.get("messages", [])
            for msg in messages:
                msg_id = str(msg.get("id", ""))
                # 이미 존재하면 건너뜀 (OpenAI API 호출 방지)
                if msg_id in existing_ids:
                    continue
                    
                try:
                    self.add_message(
                        char_id=storage_id,
                        message_id=msg_id,
                        role="assistant" if msg.get("isAi") else "user",
                        content=msg.get("content", "")
                    )
                    # 처리된 ID 추가하여 같은 세션 내 중복 방지
                    existing_ids.add(msg_id)
                except Exception as e:
                    print(f"Migration error for {msg_id}: {e}")

# 싱글톤 인스턴스 (선택 사항)
vector_service = None

def get_vector_service():
    global vector_service
    if vector_service is None:
        vector_service = VectorService()
    return vector_service
