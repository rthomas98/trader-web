<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreJournalEntryRequest;
use App\Http\Requests\UpdateJournalEntryRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class JournalEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $journalEntries = JournalEntry::where('user_id', Auth::id())
                                        ->orderBy('created_at', 'desc') // Or 'entry_at'
                                        ->paginate(10); // Adjust pagination as needed

        return Inertia::render('trading-journal/index', [
            'journalEntries' => $journalEntries,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('trading-journal/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreJournalEntryRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $validatedData['user_id'] = Auth::id();

        // Handle image uploads (store path in DB)
        if ($request->hasFile('image_before')) {
            $validatedData['image_before'] = $request->file('image_before')->store('journal_images', 'public');
        }
        if ($request->hasFile('image_after')) {
            $validatedData['image_after'] = $request->file('image_after')->store('journal_images', 'public');
        }

        JournalEntry::create($validatedData);

        return redirect()->route('journal-entries.index')->with('success', 'Journal entry created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(JournalEntry $journalEntry): Response
    {
        // Add authorization check: ensure the user owns this entry
        if ($journalEntry->user_id !== Auth::id()) {
            abort(403);
        }

        // Optional: Eager load relationships if needed (e.g., comments)
        // $journalEntry->load('comments');

        return Inertia::render('trading-journal/show', [
            'journalEntry' => $journalEntry,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(JournalEntry $journalEntry): Response
    {
        // Authorization check (can also rely on Policy or FormRequest)
        if ($journalEntry->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('trading-journal/edit', [
            'journalEntry' => $journalEntry,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateJournalEntryRequest $request, JournalEntry $journalEntry): RedirectResponse
    {
        // Authorization is handled by UpdateJournalEntryRequest
        $validatedData = $request->validated();

        // Handle image updates: Delete old image if a new one is uploaded
        if ($request->hasFile('image_before')) {
            // Delete old image if it exists
            if ($journalEntry->image_before) {
                Storage::disk('public')->delete($journalEntry->image_before);
            }
            $validatedData['image_before'] = $request->file('image_before')->store('journal_images', 'public');
        }

        if ($request->hasFile('image_after')) {
            // Delete old image if it exists
            if ($journalEntry->image_after) {
                Storage::disk('public')->delete($journalEntry->image_after);
            }
            $validatedData['image_after'] = $request->file('image_after')->store('journal_images', 'public');
        }

        $journalEntry->update($validatedData);

        // Redirect to the show page or index page
        return redirect()->route('journal-entries.show', $journalEntry)->with('success', 'Journal entry updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JournalEntry $journalEntry)
    {
        // Add authorization check: ensure the user owns this entry
        if ($journalEntry->user_id !== Auth::id()) {
            abort(403);
        }

        $journalEntry->delete();

        return redirect()->route('journal-entries.index')->with('success', 'Journal entry deleted successfully.'); // Add feedback
    }
}
