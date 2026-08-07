<?php

namespace App\Http\Requests\Seller;

use App\Enums\StoreType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
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
        ];
    }
}
