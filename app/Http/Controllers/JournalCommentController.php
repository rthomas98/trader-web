<?php

namespace App\Http\Controllers;

use App\Models\JournalComment;
use App\Models\TradingJournal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class JournalCommentController extends Controller
{
    /**
     * Store a newly created comment.
     */
    public function store(Request $request, $journalId)
    {
        $user = Auth::user();
        
        // Check if journal entry exists and belongs to user
        $journal = TradingJournal::where('id', $journalId)
                               ->where('user_id', $user->id)
                               ->firstOrFail();
        
        // Validate request
        $validated = $request->validate([
            'content' => 'required|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpeg,png,jpg,gif,pdf,doc,docx,xls,xlsx|max:5120',
        ]);
        
        // Handle attachment uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('journal-attachments', 'public');
                $attachmentPaths[] = $path;
            }
        }
        
        // Create comment
        $comment = new JournalComment();
        $comment->trading_journal_id = $journal->id;
        $comment->user_id = $user->id;
        $comment->content = $validated['content'];
        $comment->attachments = $attachmentPaths;
        $comment->save();
        
        return back()->with('success', 'Comment added successfully.');
    }

    /**
     * Update the specified comment.
     */
    public function update(Request $request, $journalId, $commentId)
    {
        $user = Auth::user();
        
        // Check if journal entry exists and belongs to user
        $journal = TradingJournal::where('id', $journalId)
                               ->where('user_id', $user->id)
                               ->firstOrFail();
        
        // Check if comment exists and belongs to user
        $comment = JournalComment::where('id', $commentId)
                               ->where('user_id', $user->id)
                               ->where('trading_journal_id', $journal->id)
                               ->firstOrFail();
        
        // Validate request
        $validated = $request->validate([
            'content' => 'required|string',
            'keep_attachments' => 'nullable|array',
            'new_attachments' => 'nullable|array',
            'new_attachments.*' => 'file|mimes:jpeg,png,jpg,gif,pdf,doc,docx,xls,xlsx|max:5120',
        ]);
        
        // Handle attachment uploads and deletions
        $attachmentPaths = $request->input('keep_attachments', []);
        
        // Delete removed attachments
        $currentAttachments = $comment->attachments ?? [];
        foreach ($currentAttachments as $path) {
            if (!in_array($path, $attachmentPaths)) {
                Storage::disk('public')->delete($path);
            }
        }
        
        // Add new attachments
        if ($request->hasFile('new_attachments')) {
            foreach ($request->file('new_attachments') as $file) {
                $path = $file->store('journal-attachments', 'public');
                $attachmentPaths[] = $path;
            }
        }
        
        // Update comment
        $comment->content = $validated['content'];
        $comment->attachments = $attachmentPaths;
        $comment->save();
        
        return back()->with('success', 'Comment updated successfully.');
    }

    /**
     * Remove the specified comment.
     */
    public function destroy($journalId, $commentId)
    {
        $user = Auth::user();
        
        // Check if journal entry exists and belongs to user
        $journal = TradingJournal::where('id', $journalId)
                               ->where('user_id', $user->id)
                               ->firstOrFail();
        
        // Check if comment exists and belongs to user
        $comment = JournalComment::where('id', $commentId)
                               ->where('user_id', $user->id)
                               ->where('trading_journal_id', $journal->id)
                               ->firstOrFail();
        
        // Delete attachments
        if (!empty($comment->attachments)) {
            foreach ($comment->attachments as $path) {
                Storage::disk('public')->delete($path);
            }
        }
        
        // Delete comment
        $comment->delete();
        
        return back()->with('success', 'Comment deleted successfully.');
    }
}
