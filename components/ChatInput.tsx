"use client";
import {
    Input
} from '@/components/ui/input';
import {
    Button
} from '@/components/ui/button';
import {
    ArrowUp
} from 'lucide-react';

interface ChatInputProps {
    input: string;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
}
// const ChatInput: React.FC<ChatInputProps> = ({
export default function ChatInput({
    input,
    handleInputChange,
    handleSubmit
}: ChatInputProps) {
    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                onChange={handleInputChange}
                value={input}
                placeholder="Ask me about makeup, skincare..."
                className="rounded-3xl bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all h-10 text-sm"
            />
            <Button className="rounded-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-5 py-1.5 shadow-sm transition-all duration-300 transform hover:scale-105">
                <ArrowUp className="h-5 w-5" />
                <span className="sr-only">Submit</span>
            </Button>
        </form>
    )
}