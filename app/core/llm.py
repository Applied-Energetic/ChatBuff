from openai import OpenAI
from app.config import settings
from typing import List, Dict

class LLMService:
    """LLM 服务类 - 负责与 DeepSeek API 交互"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self.model = settings.LLM_MODEL_NAME
    
    def generate_suggestion(self, user_text: str, related_quotes: List[Dict], parent_content: str = None) -> List[str]:
        """
        根据用户输入和相关金句生成回复建议
        
        Args:
            user_text: 用户说的话 (或当前会话上下文)
            related_quotes: RAG 检索出的相关金句列表
            parent_content: 父节点内容 (如果是在进行思维延展)
        
        Returns:
            建议回复列表
        """
        # 构建上下文
        quotes_context = "\n".join([
            f"- {q['quote']} (出自《{q['source']}》，适用场景：{q['context']})"
            for q in related_quotes
        ])
        
        # Prompt 设计
        if parent_content:
            # 思维延展模式
            prompt = f"""你是一个深度思维助手，正在帮助用户进行思维发散。

当前思维节点："{parent_content}"
用户补充/上下文："{user_text}"

请基于当前节点，结合以下金句灵感，生成 3 个后续思维发展方向（候选节点）：
{quotes_context}

要求：
1. 必须是基于“当前思维节点”的进一步延伸或反转。
2. 结合金句的智慧，但不要生硬引用。
3. 三个方向要有差异（例如：一个是深入分析，一个是幽默反转，一个是行动建议）。
4. 每个选项不超过 20 字。

直接返回 3 条建议，每条一行。"""
        else:
            # 普通建议模式
            prompt = f"""你是一个社交对话助手，帮助用户在聊天时展现智慧和幽默。

用户正在说："{user_text}"

以下是一些相关的金句供参考：
{quotes_context}

请给出 3 条回复建议：
1. 一条幽默风趣的回复（可以结合金句改编）
2. 一条展现深度的回复（引用金句或哲理）
3. 一条温暖真诚的回复

要求：
- 简短有力，不超过 30 字
- 既要引用恰当，又要展现个人智慧
- 避免生硬堆砌，要自然流畅

直接返回 3 条建议，每条一行，不需要编号。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的社交对话助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=500
            )
            
            # 解析返回结果
            content = response.choices[0].message.content
            suggestions = [line.strip() for line in content.split('\n') if line.strip()]
            
            return suggestions[:3]  # 确保只返回 3 条
            
        except Exception as e:
            print(f"LLM 调用失败: {e}")
            return [
                "生活就像一盒巧克力，你永远不知道下一颗是什么味道。",
                "听过很多道理，依然过不好这一生。",
                "真诚是永远的通行证。"
            ]

# 单例模式
llm_service = LLMService()
