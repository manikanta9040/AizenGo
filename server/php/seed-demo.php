<?php
declare(strict_types=1);

/**
 * Creates development-only login accounts for a local AizenGo database.
 * Never run this against a production database: it resets these accounts' passwords.
 *
 * Run from server/php:
 *   php seed-demo.php
 */

function environment(): array
{
    $values = [];
    $file = dirname(__DIR__) . '/.env';
    if (!is_file($file)) {
        return $values;
    }

    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        $values[trim($key)] = $value;
    }
    return $values;
}

$env = environment();
$host = getenv('DATABASE_HOST') ?: ($env['DATABASE_HOST'] ?? '127.0.0.1');
$port = getenv('DATABASE_PORT') ?: ($env['DATABASE_PORT'] ?? '3306');
$database = getenv('DATABASE_NAME') ?: ($env['DATABASE_NAME'] ?? null);
$user = getenv('DATABASE_USER') ?: ($env['DATABASE_USER'] ?? null);
$password = getenv('DATABASE_PASSWORD') ?: ($env['DATABASE_PASSWORD'] ?? '');

if (!$database || !$user) {
    fwrite(STDERR, "Database configuration is incomplete. Set DATABASE_NAME and DATABASE_USER in server/.env.\n");
    exit(1);
}

$pdo = new PDO(
    "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
    $user,
    $password,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$accounts = [
    ['id' => 'dev-user-001', 'name' => 'AizenGo Attendee', 'email' => 'user@aizen.test', 'password' => 'aizen123', 'role' => 'USER'],
    ['id' => 'dev-admin-001', 'name' => 'AizenGo Administrator', 'email' => 'admin@aizen.test', 'password' => 'admin123', 'role' => 'ADMIN'],
    ['id' => 'dev-super-001', 'name' => 'AizenGo Super Administrator', 'email' => 'superadmin@aizen.test', 'password' => 'super123', 'role' => 'SUPER_ADMIN'],
];

$statement = $pdo->prepare(
    'INSERT INTO `User` (id, name, email, passwordHash, role, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE name = VALUES(name), passwordHash = VALUES(passwordHash), role = VALUES(role), updatedAt = UTC_TIMESTAMP(3)'
);

foreach ($accounts as $account) {
    $statement->execute([
        $account['id'],
        $account['name'],
        $account['email'],
        password_hash($account['password'], PASSWORD_DEFAULT),
        $account['role'],
    ]);
    echo "Seeded {$account['role']}: {$account['email']}\n";
}

echo "Development accounts are ready.\n";
