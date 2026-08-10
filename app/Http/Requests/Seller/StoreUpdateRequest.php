<?php

namespace App\Http\Requests\Seller;

use App\Enums\StoreType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->description ?: null,
            'contact_number' => $this->contact_number ?: null,
            'latitude' => $this->latitude ?: null,
            'longitude' => $this->longitude ?: null,
            'service_radius_km' => $this->service_radius_km ?: null,
            'delivery_fee' => $this->delivery_fee !== '' ? $this->delivery_fee : null,
            'min_order_amount' => $this->min_order_amount !== '' ? $this->min_order_amount : null,
            'accepts_online_payment' => $this->boolean('accepts_online_payment'),
            'gcash_number' => $this->gcash_number ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'address' => ['required', 'string'],
            'contact_number' => ['nullable', 'string', 'max:15'],
            'type' => ['required', new Enum(StoreType::class)],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'service_radius_km' => ['nullable', 'numeric', 'min:0.1', 'max:100'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0', 'max:100000', 'decimal:0,2'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0', 'max:1000000', 'decimal:0,2'],
            'accepts_online_payment' => ['boolean'],
            // A GCash number is required once the seller turns online payment on.
            'gcash_number' => [Rule::requiredIf($this->boolean('accepts_online_payment')), 'nullable', 'string', 'max:20'],
            'gcash_qr' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
