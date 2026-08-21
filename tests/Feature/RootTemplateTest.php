<?php

it('loads webfonts only through the @fonts pipeline', function () {
    $html = $this->get('/')->assertOk()->getContent();

    expect($html)->not->toContain('fonts.bunny.net/css?family=');
});

it('paints the html background with the current theme tokens', function () {
    $html = $this->get('/')->assertOk()->getContent();

    expect($html)
        ->toContain('background-color: oklch(0.9578 0.0045 179.73)')
        ->toContain('background-color: oklch(0.188 0.0177 182.67)');
});
