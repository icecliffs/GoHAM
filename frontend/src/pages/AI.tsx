"use client"

import React, { useState, useCallback } from "react"
import { Chat } from "@douyinfe/semi-ui"
import OpenAI from "openai"
import { getAllLog } from "@/services/hamlog/api"
interface ChatMessage {
  role: "system" | "user" | "assistant"
  id: string
  createAt: number
  content: string
}
interface LogAddress {
  id: number
  name: string
  country: string
  prefix: string
  adif: string
  cqzone: string
  ituzone: string
  continent: string
  latitude: string
  longitude: string
  gmtoffset: string
  exactcallsign: string
}

interface Log {
  id: number
  date: string
  endate: string
  tosign: string
  fromsign: string
  frequency: string
  band: string
  method: string
  tosignal: string
  fromsignal: string
  topower: string
  frompower: string
  toantenna: string
  fromantenna: string
  todevice: string
  fromdevice: string
  toqth: string
  fromqth: string
  duration: string
  content: string
  country: string
  fromcountry: string
  address: LogAddress
  userid: number
}

interface LogResponse {
  code: number
  data: Log[]
  message: string
  page: string
  total: number
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  id: string
  createAt: number
  content: string
}
const shouldFetchLogs = (content: string) => {
  const keywords = [
    '分析日志', '通联记录', 'QSO', '日志分析', '日志',
    '联系记录', '最近通联', '信号报告',
    '电台日志', '通联详情'
  ]
  return keywords.some(keyword => content.includes(keyword))
}
const formatLogs = (logs: API.Log[]) => {
  return logs.map(log => 
    `[${log.date}] ${log.fromsign} ➔ ${log.tosign}
    ─ 频段: ${log.band} | 模式: ${log.method}
    ─ 信号报告: ${log.fromsignal} ➔ ${log.tosignal}
    ─ 功率: ${log.frompower}W ➔ ${log.topower}W
    ─ 天线: ${log.fromantenna} ➔ ${log.toantenna}
    ─ 设备: ${log.fromdevice} ➔ ${log.todevice}
    ─ 位置: ${log.fromqth} ➔ ${log.toqth}
    ─ 时长: ${log.duration}分钟
    ▏内容: ${log.content}`
  ).join('\n\n')
}
const roleInfo = {
  user: {
    name: "User",
    avatar: "https://bfs.iloli.moe/logo.png",
  },
  assistant: {
    name: "GoHAM AI",
    avatar: "https://bfs.iloli.moe/logo.png",
  },
  system: {
    name: "System",
    avatar: "https://bfs.iloli.moe/logo.png",
  },
}

let idCounter = 0
const getId = () => `id-${idCounter++}`

// 应付课设，项目上线别这样搞，会漏API Key的
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: '',
  dangerouslyAllowBrowser: true
})

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      id: getId(),
      createAt: Date.now(),
      content: "您好！这里是GoHAM AI助手，需要分析通联记录或电台日志吗？",
    },
  ])
  const [loading, setLoading] = useState(false)

  // 关键词检测
  const shouldFetchLogs = (content: string) => {
    const keywords = [
      '分析日志', '通联记录', 'QSO', '日志分析', '日志',
      '联系记录', '最近通联', '信号报告',
      '电台日志', '通联详情'
    ]
    return keywords.some(keyword => content.includes(keyword))
  }

  // 专业日志格式化
  const formatLogs = (logs: Log[]) => {
    return logs.map(log => 
      `【${log.date}】${log.fromsign} → ${log.tosign}
      频段：${log.band}（${log.method}）
      信号：${log.fromsignal} ➔ ${log.tosignal}
      功率：${log.frompower}W ➔ ${log.topower}W
      天线：${log.fromantenna} ➔ ${log.toantenna}
      设备：${log.fromdevice} ➔ ${log.todevice}
      位置：${log.fromqth} ➔ ${log.toqth}
      时长：${log.duration}分钟
      内容：${log.content}`
    ).join('\n\n')
  }

  const handleMessageSend = useCallback(async (content: string) => {
    if (!content.trim()) return
    
    const userMessage: ChatMessage = {
      role: "user",
      id: getId(),
      createAt: Date.now(),
      content,
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      let systemPrompt = ""
      const messagesForAPI = [...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))]

      if (shouldFetchLogs(content)) {
        try {
          const loadingMessage: ChatMessage = {
            role: "assistant",
            id: getId(),
            createAt: Date.now(),
            content: "🛰️ 正在查询通联日志...",
          }
          setMessages(prev => [...prev, loadingMessage])

          const logResponse = await getAllLog(
            { current: 1, pageSize: 15 },
            { skipErrorHandler: true }
          ) as LogResponse

          setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id))

          if (logResponse?.data?.length > 0) {
            const formattedLogs = formatLogs(logResponse.data)
            systemPrompt = `[最新${logResponse.total}条通联记录]\n${formattedLogs}\n\n分析要求：
1. 信号质量评估
2. 设备使用情况
3. 传播特性分析
4. 改进建议`
          } else {
            systemPrompt = "当前没有通联记录，请先完成至少一次QSO"
          }
        } catch (error) {
          console.error('日志获取失败:', error)
          systemPrompt = "⚠️ 日志服务暂时不可用，将基于现有知识回答"
        }
      }

      // 构建最终消息
      messagesForAPI.push({ role: "user", content })
      if (systemPrompt) {
        messagesForAPI.unshift({
          role: "system",
          content: `${systemPrompt}\n回答格式要求：
• 使用中文分点说明
• 标注重要数据
• 包含操作建议`
        })
      }

      const completion = await openai.chat.completions.create({
        messages: messagesForAPI,
        model: "deepseek-chat",
      })

      const assistantReply = completion.choices[0]?.message?.content 
        || "暂时无法提供分析，请尝试更详细的描述"

      const assistantMessage: ChatMessage = {
        role: "assistant",
        id: getId(),
        createAt: Date.now(),
        content: assistantReply,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error during completion:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        id: getId(),
        createAt: Date.now(),
        content: "⚠️ 分析服务暂时不可用，请稍后重试",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }, [messages])

  const handleMessageReset = useCallback(() => {
    setMessages([{
      role: "assistant",
      id: getId(),
      createAt: Date.now(),
      content: "对话已重置，需要分析通联记录吗？"
    }])
  }, [])

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      height: "50vh",
      backgroundColor: "#f5f6f7"
    }}>
      <main style={{ 
        flex: 1,
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%"
      }}>
        <div style={{
          height: "100%",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          backgroundColor: "white",
          overflow: "hidden"
        }}>
          <Chat
            align="leftRight"
            mode="bubble"
            chats={messages}
            roleConfig={roleInfo}
            onMessageSend={handleMessageSend}
            onMessageReset={handleMessageReset}
            loading={loading}
            chatListStyle={{
              padding: "20px"
            }}
            inputStyle={{
              borderTop: "1px solid #eee"
            }}
          />
        </div>
      </main>
    </div>
  )
}

export default ChatPage