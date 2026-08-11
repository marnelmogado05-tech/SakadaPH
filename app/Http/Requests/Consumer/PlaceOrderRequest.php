<?php

namespace App\Http\Requests\Consumer;

use App\Enums\FulfillmentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'delivery_address' => $this->delivery_address ?: null,
            'notes' => $this->notes ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isDelivery = $this->input('fulfillment_type') === FulfillmentType::Delivery->value;

        return [
            'fulfillment_type' => ['required', Rule::enum(FulfillmentType::class)],
            // Cash, or manual GCash (pay-then-submit-reference); card is not offered.
            'payment_method' => ['required', 'in:cash,gcash'],
            'contact_number' => ['required', 'string', 'max:20'],
            'delivery_address' => [Rule::requiredIf($isDelivery), 'nullable', 'string', 'max:500'],
            'delivery_latitude' => [Rule::requiredIf($isDelivery), 'nullable', 'numeric', 'between:-90,90'],
            'delivery_longitude' => [Rule::requiredIf($isDelivery), 'nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
