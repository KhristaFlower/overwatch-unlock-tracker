<?php

$inputFile = __DIR__ . '/heroData.csv';
$outputFile = __DIR__ . '/../app/heroData.js';

$csvArray = array_map('str_getcsv', file($inputFile));

$costs = [
    'Common' => 25,
    'Rare' => 75,
    'Epic' => 250,
    'Legendary' => 1000,
    'Special' => 0, // Pre-order bonuses.
    'Achievement' => 0, // Unlocked via achievements.
    'None' => 0 // Currently golden weapons that use separate currency.
];

$weapons = [

];

$output = [];

foreach ($csvArray as $csvLine) {

    list($hero, $category, $name, $rarity, $order) = $csvLine;


    $key = preg_replace('/[^\w\d]/', '', strtolower($hero));

    $output[$key]['display'] = $hero;
    $output[$key][$category][] = [
        'name' => $name,
        'rarity' => $rarity,
        'displayOrder' => (int)$order,
        'cost' => $costs[$rarity]
    ];

}


$comment = '/** Generated automatically using generateHeroDataJS.php */';
$json = json_encode($output, JSON_PRETTY_PRINT);

if ($json === false) {
    print "JSON encoding failed! " . json_last_error_msg() . "\n";
} else {
    $fileContent = "$comment\nvar heroData = $json;";
    // Numbers converts user-added ellipsis to a special character which breaks things.
    $fileContent = str_replace("\u2026", '...', $fileContent);
    file_put_contents($outputFile, $fileContent);
}
