<x-mail::message>
# Your store has been approved!

Hi {{ $store->user->first_name }},

Great news! Your store **{{ $store->name }}** has been approved on Sakada.ph. You can now log in and start managing your store.

<x-mail::button :url="route('seller.dashboard')">
Go to your dashboard
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
