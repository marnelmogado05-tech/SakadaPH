<?php

namespace App\Http\Requests;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SellerRegistrationRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'store_name' => ['required', 'string', 'max:255'],
            'store_address' => ['required', 'string', 'max:500'],
            'store_description' => ['nullable', 'string', 'max:1000'],
            'store_contact_number' => ['nullable', 'string', 'max:15'],
        ];
    }
}
