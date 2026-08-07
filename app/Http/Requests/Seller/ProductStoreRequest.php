<?php

namespace App\Http\Requests\Seller;

use App\Enums\ProductAvailability;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class ProductStoreRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->description ?: null,
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
            'price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'unit' => ['required', 'string', 'max:50'],
            'quantity' => ['required', 'integer', 'min:0'],
            'availability' => ['required', new Enum(ProductAvailability::class)],
            'image' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
