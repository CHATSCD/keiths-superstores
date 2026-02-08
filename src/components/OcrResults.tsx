'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { OcrResult, OcrLineItem } from '@/types';
import { getEmployees } from '@/lib/storage';

interface OcrResultsProps {
  result: OcrResult;
  type: 'production' | 'waste';
  onConfirm: (result: OcrResult) => void;
  onDiscard: () => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 80) return <Badge variant="success">{confidence}%</Badge>;
  if (confidence >= 60) return <Badge variant="warning">{confidence}%</Badge>;
  return <Badge variant="danger">{confidence}%</Badge>;
}

function ConfidenceIcon({ confidence }: { confidence: number }) {
  if (confidence >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (confidence >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

export default function OcrResults({ result, type, onConfirm, onDiscard }: OcrResultsProps) {
  const employees = getEmployees();
  const [editedResult, setEditedResult] = useState<OcrResult>({ ...result });
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const updateItem = (idx: number, updates: Partial<OcrLineItem>) => {
    const newItems = [...editedResult.items];
    newItems[idx] = { ...newItems[idx], ...updates };
    setEditedResult({ ...editedResult, items: newItems });
  };

  const removeItem = (idx: number) => {
    const newItems = editedResult.items.filter((_, i) => i !== idx);
    setEditedResult({ ...editedResult, items: newItems });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">OCR Results</h3>
        <ConfidenceBadge confidence={editedResult.overallConfidence} />
      </div>

      {/* Employee & Shift */}
      <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
        <div>
          <label className="text-xs text-muted-foreground">Employee</label>
          {employees.length > 0 ? (
            <Select
              value={editedResult.employeeName}
              onChange={(e) =>
                setEditedResult({ ...editedResult, employeeName: e.target.value })
              }
            >
              <option value="">Select...</option>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
              {editedResult.employeeName &&
                !employees.find((e) => e.name === editedResult.employeeName) && (
                  <option value={editedResult.employeeName}>
                    {editedResult.employeeName} (detected)
                  </option>
                )}
            </Select>
          ) : (
            <Input
              value={editedResult.employeeName}
              onChange={(e) =>
                setEditedResult({ ...editedResult, employeeName: e.target.value })
              }
              placeholder="Employee name"
            />
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Shift</label>
          <Select
            value={editedResult.shift}
            onChange={(e) =>
              setEditedResult({
                ...editedResult,
                shift: e.target.value as 'AM' | 'PM' | 'Night',
              })
            }
          >
            <option value="">Select...</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="Night">Night</option>
          </Select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {editedResult.items.length} items detected
        </h4>
        {editedResult.items.map((item, idx) => (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
            >
              <ConfidenceIcon confidence={item.confidence} />
              <span className="text-sm flex-1 font-medium truncate">{item.matchedItem}</span>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  e.stopPropagation();
                  updateItem(idx, { quantity: parseInt(e.target.value) || 0 });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-7 text-center text-sm"
                min={0}
              />
              <ConfidenceBadge confidence={item.confidence} />
              {expandedItem === idx ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {expandedItem === idx && (
              <div className="border-t bg-gray-50 p-2 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Raw text: &quot;{item.rawText}&quot;
                </div>
                {item.alternatives.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Alternatives:</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {item.alternatives.map((alt, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() =>
                            updateItem(idx, {
                              matchedItem: alt.name,
                              confidence: alt.score,
                            })
                          }
                          className="text-xs px-2 py-0.5 rounded border hover:bg-white transition-colors"
                        >
                          {alt.name} ({alt.score}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(idx)}
                  className="text-xs h-7"
                >
                  Remove Item
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onDiscard} variant="outline" className="flex-1">
          Discard
        </Button>
        <Button
          onClick={() => onConfirm(editedResult)}
          className="flex-1 bg-keiths-red hover:bg-keiths-darkRed"
          disabled={!editedResult.employeeName || !editedResult.shift || editedResult.items.length === 0}
        >
          Save {type === 'production' ? 'Production' : 'Waste'} Report
        </Button>
      </div>
    </div>
  );
}
