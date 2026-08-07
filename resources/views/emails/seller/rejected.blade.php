<x-mail::message>
# Store application not approved

Hi {{ $store->user->first_name }},

We've reviewed your application for **{{ $store->name }}** and unfortunately we're unable to approve it at this time.

**Reason:** {{ $store->rejection_reason }}

If you believe this was a mistake or would like to reapply, please contact our support team.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
