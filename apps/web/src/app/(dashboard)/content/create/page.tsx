"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft, Check, LayoutTemplate, Target, Users } from "lucide-react"
import Link from "next/link"

export default function CreateContentPage() {
  const [step, setStep] = React.useState(1)

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in-50 duration-500">
      <div className="flex items-center space-x-4">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create AI Content</h1>
          <p className="text-gray-500">Generate optimized marketing content in seconds.</p>
        </div>
      </div>

      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
        {[
          { num: 1, label: "Topic", icon: LayoutTemplate },
          { num: 2, label: "Platform", icon: LayoutTemplate },
          { num: 3, label: "Audience", icon: Users },
          { num: 4, label: "Objective", icon: Target },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center bg-gray-50 px-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= s.num ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
              {step > s.num ? <Check className="h-5 w-5" /> : s.num}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">What do you want to post about?</h2>
                <p className="text-sm text-gray-500">Describe your topic, paste a URL, or select from research.</p>
              </div>
              <textarea
                className="w-full h-32 rounded-md border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5 reasons why small businesses need managed IT services to prevent cyber attacks..."
              ></textarea>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose platform</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['LinkedIn', 'Twitter/X', 'Instagram', 'Facebook', 'Blog Post', 'Google Business'].map(platform => (
                  <div key={platform} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <p className="font-medium text-center">{platform}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Target Audience</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['IT Decision Makers & CIOs', 'Small Business Owners', 'General Professionals', 'Existing Clients'].map(aud => (
                  <div key={aud} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <p className="font-medium">{aud}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Objective & Intent</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['Educate / Inform', 'Generate Leads / Sales', 'Build Brand Awareness', 'Engage Community'].map(obj => (
                  <div key={obj} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <p className="font-medium">{obj}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Content
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
