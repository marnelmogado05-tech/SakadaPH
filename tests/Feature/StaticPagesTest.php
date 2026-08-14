<?php

it('shows the welcome page', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});

it('shows the about page', function () {
    $this->get('/about')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('about'));
});

it('shows the contact page', function () {
    $this->get('/contact')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('contact'));
});

it('shows the how to use page', function () {
    $this->get('/how-to-use')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('how-to-use'));
});

it('shows the terms of service page', function () {
    $this->get('/terms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('terms'));
});

it('shows the privacy policy page', function () {
    $this->get('/privacy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('privacy'));
});
