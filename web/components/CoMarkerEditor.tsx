"use client";

import React, { useState } from "react";
import { PenTool, Check, Trash2, Sparkles, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "./ui/Card";
import { Button, IconButton } from "./ui/Button";
import { Badge } from "./ui/badge";

interface Mark {
  id: string;
  text: string;
  type: "circle" | "highlight" | "underline" | "box" | "bracket";
  comment?: string;
}

export default function CoMarkerEditor() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [inputText, setInputTopic] = useState("");

  const addMark = (type: Mark["type"]) => {
    const selection = window.getSelection()?.toString();
    if (!selection) return;

    const newMark: Mark = {
      id: Math.random().toString(36).substring(7),
      text: selection,
      type,
    };
    setMarks([...marks, newMark]);
  };

  const removeMark = (id: string) => {
    setMarks(marks.filter((m) => m.id !== id));
  };

  return (
    <Card className="h-full border-border bg-surface-base shadow-glass-sm overflow-hidden flex flex-col">
      <CardHeader className="border-b border-border bg-surface-secondary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <PenTool size={16} />
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Co_Marker</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {["circle", "highlight", "underline", "box", "bracket"].map((type) => (
              <IconButton
                key={type}
                aria-label={`Mark as ${type}`}
                icon={<Plus size={14} />}
                variant="ghost"
                size="sm"
                onClick={() => addMark(type as any)}
                title={`Mark ${type}`}
                className="h-8 w-8 hover:bg-accent-primary/10 hover:text-accent-primary"
              />
            ))}
          </div>

        </div>
      </CardHeader>
      <CardBody className="flex-1 flex overflow-hidden p-0">
        <div className="flex-1 p-8 overflow-y-auto bg-surface-base border-r border-border">
          <div
            contentEditable
            onInput={(e) => setInputTopic(e.currentTarget.innerText)}
            className="w-full h-full outline-none font-sans text-base leading-relaxed text-text-primary prose dark:prose-invert max-w-none"
            placeholder="Paste text here to begin marking..."
          />
        </div>
        <aside className="w-80 bg-surface-secondary/10 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-2">Annotation_Stack</div>
          {marks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <Sparkles size={32} className="mb-4" />
              <p className="text-[10px] font-mono uppercase text-center">No active marks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {marks.map((mark) => (
                <div key={mark.id} className="p-3 rounded-xl border border-border bg-surface-base shadow-sm group">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-accent-primary/20 text-accent-primary">
                      {mark.type}
                    </Badge>
                    <IconButton
                      aria-label="Remove mark"
                      icon={<X size={12} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMark(mark.id)}
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />


                  </div>
                  <p className="text-xs font-medium text-text-primary line-clamp-2 italic">"{mark.text}"</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </CardBody>
    </Card>
  );
}
