"use client" // 客户端组件
import {
  useChat
}from'@ai-sdk/react'
import Link from "next/link";
import ChatInput from '@/components/ChatInput';
import ChatOutput from '@/components/ChatOutput';
export default function Home(){
  //chat llm 业务 抽离
  const{
    input,//输入框的值
    messages,//消息列表
    status,//状态
    handleInputChange,//输入框变化
    handleSubmit//提交
  }=useChat();
  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex justify-end mb-1">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline"
        >
          登录
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 bg-clip-text text-transparent tracking-wide">CodeGPT - 智能代码问答系统</h1>
      <div className="space-y-2 mb-3 max-h-[80vh] overflow-y-auto">
        <ChatOutput messages={messages} status={status}  />
      </div>
      <div className="mb-1">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}