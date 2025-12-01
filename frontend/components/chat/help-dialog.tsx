import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Settings, Sun, Moon } from 'lucide-react';

interface HelpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center mb-2">Welcome to Shipper Chat!</DialogTitle>
                    <DialogDescription className="text-center">
                        Here's a quick guide to get you started.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Real-time Messaging</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Send and receive messages instantly. Start a new chat click + icon.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Group Chats</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Create groups to chat with multiple people at once. Click group icon and create group.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <div className="relative">
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute top-0 left-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Theme Support</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Switch between light and dark modes for your comfort.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Help & Settings</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Access this help screen anytime by clicking the settings icon.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-2">
                    <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-w-[120px]">
                        Got it!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
