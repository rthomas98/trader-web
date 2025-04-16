<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\TradingWallet; 
use Illuminate\Support\Facades\Auth; 

class StoreTradingOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            return false;
        }

        // Optional: Check if the provided trading_wallet_id belongs to the authenticated user
        $walletId = $this->input('trading_wallet_id');
        if ($walletId) {
            $wallet = TradingWallet::where('id', $walletId)->where('user_id', Auth::id())->first();
            return $wallet !== null;
        }

        // Allow if authenticated and wallet check passes or no wallet ID provided yet
        // Note: Wallet ID existence is checked in rules(), this authorize focuses on ownership
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        // TODO: Implement dynamic check for available pairs if possible,
        // maybe by injecting TradingService or creating a custom Rule.
        // For now, just basic validation.

        return [
            'trading_wallet_id' => [
                'required',
                'string', // Assuming UUIDs are strings
                // Ensure the wallet exists and belongs to the authenticated user
                Rule::exists('trading_wallets', 'id')->where(function ($query) {
                    $query->where('user_id', Auth::id());
                }),
            ],
            'currency_pair' => ['required', 'string', 'max:10'], // Basic check, consider custom rule later
            'side' => ['required', 'string', Rule::in(['BUY', 'SELL'])],
            'quantity' => ['required', 'numeric', 'gt:0'], // Must be greater than 0
            'order_type' => ['required', 'string', Rule::in(['MARKET', 'LIMIT'])],
            'entry_price' => [
                'required_if:order_type,LIMIT', // Required only for LIMIT orders
                'nullable', // Allow null for MARKET orders
                'numeric',
                'gt:0' // Price must be positive
            ],
            'stop_loss' => ['nullable', 'numeric', 'gt:0'], // Optional, but must be positive if provided
            'take_profit' => ['nullable', 'numeric', 'gt:0'], // Optional, but must be positive if provided
            // Add validation for time_in_force if needed later
        ];
    }

     /**
     * Prepare the data for validation.
     *
     * Modify input before validation, e.g., set entry_price to null for MARKET orders.
     */
    protected function prepareForValidation(): void
    {
        if ($this->input('order_type') === 'MARKET') {
            $this->merge([
                'entry_price' => null,
            ]);
        }
    }
}
