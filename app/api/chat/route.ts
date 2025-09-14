import {
    embed,
    streamText
} from 'ai';
import {
    createOpenAI
} from '@ai-sdk/openai';
import {
    createClient
} from '@supabase/supabase-js';
import { log } from 'console';

const supabase = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_KEY ?? ""
);

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
})

async function generateEmbedding(message: string) {
    return embed({
        model: openai.embedding('text-embedding-3-small'),
        value: message
    })
}

async function fetchRelevantContext(embedding: number[]) {
    const {
        data,
        error
    } = await supabase.rpc("get_relevant_chunks", {
        query_vector: embedding,
        match_threshold: 0.7,
        match_count: 3
    })

    if (error) throw error;
    console.log(data, '////////////////')
    return JSON.stringify(
        data.map((item: any) => `
        Source: ${item.url},
        Date Updated: ${item.date_updated}
        Content: ${item.content}  
      `)
    )
}

const createPrompt = (context: string, userQuestion: string) => {
    return {
        role: 'system',
        content: `
          你是一位专业的化妆品和美妆顾问，可以解答关于护肤、彩妆、美发等相关问题。
          请使用以下上下文信息来回答用户问题：
          ----------------
          START CONTEXT
          ${context}
          END CONTEXT
          ----------------
          
          要求：
          - 用 Markdown 格式返回答案
          - 答案里包含相关链接和信息最后更新时间
          - 如果上下文信息不足，请结合你自己的知识回答，但需要提示用户答案可能不是最新的
          - 如果用户的问题与化妆品无关，请礼貌告知只能回答化妆品相关问题
          
          ----------------
          QUESTION: ${userQuestion}
          ----------------`
    }
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const latestMessage = messages.at(-1).content;
        // embedding
        const { embedding } = await generateEmbedding(latestMessage);
        // console.log(embedding);
        // 相似度计算
        const context = await fetchRelevantContext(embedding);
        const prompt = createPrompt(context, latestMessage);
        console.log(prompt);
        const result = streamText({
            model:openai("gpt-4o-mini"),
            messages:[prompt,...messages]
        })
        return result.toDataStreamResponse();
    } catch (err) {
        throw err;
    }
}