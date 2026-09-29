"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, User, Send, Paperclip, Sparkles } from "lucide-react"

export default function AssistantPage() {
  const [messages] = React.useState([
    { role: 'assistant', content: 'Hi there! I am your AI Marketing Assistant for Drashti Softex. I can help you find SEO opportunities, generate content ideas, or analyze your recent performance. What would you like to do today?' }
  ])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Assistant</h1>
          <p className="text-gray-500">Your dedicated marketing and SEO co-pilot.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-gray-200">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'assistant' ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {["Find SEO opportunities", "Give me 5 content ideas", "Analyze my recent content"].map(suggestion => (
                <button key={suggestion} className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium rounded-full transition-colors border border-blue-200">
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="relative flex items-center">
              <Button variant="ghost" size="icon" className="absolute left-2 text-gray-400">
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="text"
                placeholder="Ask your AI assistant..."
                className="w-full h-12 pl-12 pr-14 rounded-full border border-gray-300 bg-gray-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
              <Button size="icon" className="absolute right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="hidden lg:flex flex-col w-80 shrink-0 gap-4 overflow-y-auto">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center"><Sparkles className="h-4 w-4 mr-2 text-blue-600" /> Current Context</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Workspace</span>
                  <p className="font-medium">Drashti Softex</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Industry</span>
                  <p className="font-medium">IT Services & Hardware</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Target Audience</span>
                  <p className="font-medium">Small-Medium Business Owners</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
