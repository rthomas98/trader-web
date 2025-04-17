<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\JournalEntry;

class UpdateJournalEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Get the journal entry from the route
        $journalEntry = $this->route('journal_entry');

        // Check if the entry exists and if the authenticated user owns it
        return $journalEntry && $this->user()->can('update', $journalEntry);
        // Alternatively, if not using Policies:
        // return $journalEntry && $journalEntry->user_id === $this->user()->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Similar rules to Store, potentially allowing some fields to be optional
        // if they don't need to be changed on every update.
        return [
            'pair' => ['sometimes', 'required', 'string', 'max:20'],
            'direction' => ['sometimes', 'required', Rule::in(['long', 'short'])],
            'entry_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'exit_price' => ['nullable', 'numeric', 'min:0'],
            'stop_loss' => ['nullable', 'numeric', 'min:0'],
            'take_profit' => ['nullable', 'numeric', 'min:0'],
            'risk_reward_ratio' => ['nullable', 'numeric', 'min:0'],
            'profit_loss' => ['nullable', 'numeric'],
            'outcome' => ['nullable', Rule::in(['win', 'loss', 'breakeven'])],
            'entry_at' => ['sometimes', 'required', 'date'],
            'exit_at' => ['nullable', 'date', 'after_or_equal:entry_at'],
            'setup_reason' => ['nullable', 'string'],
            'execution_notes' => ['nullable', 'string'],
            'post_trade_analysis' => ['nullable', 'string'],
            // Handle image updates - 'nullable' if not replacing, 'image' if new file is uploaded
            'image_before' => ['nullable', 'image', 'max:2048'],
            'image_after' => ['nullable', 'image', 'max:2048'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ];
    }
}
