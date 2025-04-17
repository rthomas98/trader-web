<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJournalEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Ensure the user is authenticated
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pair' => ['required', 'string', 'max:20'],
            'direction' => ['required', Rule::in(['long', 'short'])],
            'entry_price' => ['required', 'numeric', 'min:0'],
            'exit_price' => ['nullable', 'numeric', 'min:0'],
            'stop_loss' => ['nullable', 'numeric', 'min:0'],
            'take_profit' => ['nullable', 'numeric', 'min:0'],
            'risk_reward_ratio' => ['nullable', 'numeric', 'min:0'],
            'profit_loss' => ['nullable', 'numeric'], // Can be negative
            'outcome' => ['nullable', Rule::in(['win', 'loss', 'breakeven'])],
            'entry_at' => ['required', 'date'],
            'exit_at' => ['nullable', 'date', 'after_or_equal:entry_at'],
            'setup_reason' => ['nullable', 'string'],
            'execution_notes' => ['nullable', 'string'],
            'post_trade_analysis' => ['nullable', 'string'],
            'image_before' => ['nullable', 'image', 'max:2048'], // Example: limit image size
            'image_after' => ['nullable', 'image', 'max:2048'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'], // Validate each tag if it's an array of strings
        ];
    }
}
