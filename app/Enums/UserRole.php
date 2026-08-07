<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Seller = 'seller';
    case User = 'user';
}
