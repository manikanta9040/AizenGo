<?php
declare(strict_types=1);

/**
 * A dependency-free PHP implementation of the AizenGo API.
 *
 * Run locally with:
 *   php -S 0.0.0.0:4000 -t public public/router.php
 */

const SESSION_SECONDS = 604800; // Seven days.

/** @return array<string, string> */
function loadEnvironment(): array
{
    $values = [];
    $envFile = dirname(__DIR__, 2) . '/.env';
    if (!is_file($envFile)) {
        return $values;
    }

    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        $values[$name] = $value;
    }
    return $values;
}

$environment = loadEnvironment();

function config(string $name, ?string $default = null): ?string
{
    global $environment;
    $value = getenv($name);
    return $value === false ? ($environment[$name] ?? $default) : $value;
}

function connection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = config('DATABASE_HOST', '127.0.0.1');
    $port = config('DATABASE_PORT', '3306');
    $database = config('DATABASE_NAME');
    $user = config('DATABASE_USER');
    $password = config('DATABASE_PASSWORD');
    if (!$database || !$user) {
        throw new RuntimeException('Database configuration is incomplete. Set DATABASE_NAME and DATABASE_USER in server/.env.');
    }

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
        $user,
        $password ?: '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

function respond(mixed $body = null, int $status = 200): never
{
    http_response_code($status);
    if ($status !== 204) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
    exit;
}

function errorResponse(string $message, int $status): never
{
    respond(['message' => $message], $status);
}

/** @return array<string, mixed> */
function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        errorResponse('Invalid JSON request body.', 400);
    }
    return is_array($decoded) ? $decoded : [];
}

/** @param array<string, mixed> $user @return array<string, mixed> */
function publicUser(array $user): array
{
    $result = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ];
    if ($user['avatar'] !== null) {
        $result['avatar'] = $user['avatar'];
    }
    return $result;
}

function bearerToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;
}

function tokenHash(string $token): string
{
    return hash('sha256', $token);
}

function createSession(string $userId): string
{
    $token = bin2hex(random_bytes(32));
    $statement = connection()->prepare('INSERT INTO `Session` (`tokenHash`, `userId`, `expiresAt`) VALUES (?, ?, ?)');
    $statement->execute([tokenHash($token), $userId, gmdate('Y-m-d H:i:s', time() + SESSION_SECONDS)]);
    return $token;
}

/** @return array<string, mixed>|null */
function sessionUser(?string $token): ?array
{
    if (!$token) {
        return null;
    }
    $hash = tokenHash($token);
    $statement = connection()->prepare('SELECT u.* FROM `Session` s JOIN `User` u ON u.id = s.userId WHERE s.tokenHash = ? AND s.expiresAt > UTC_TIMESTAMP()');
    $statement->execute([$hash]);
    $user = $statement->fetch();
    if ($user) {
        return $user;
    }
    connection()->prepare('DELETE FROM `Session` WHERE tokenHash = ? AND expiresAt <= UTC_TIMESTAMP()')->execute([$hash]);
    return null;
}

/** Generate an identifier compatible in shape with the IDs previously created by Prisma. */
function newId(): string
{
    return 'c' . bin2hex(random_bytes(12));
}

/** @param array<string, mixed> $payload */
function recordKey(array $payload, string $fallback): string
{
    foreach (['id', 'slug', 'month', 'name'] as $field) {
        if (isset($payload[$field]) && is_string($payload[$field]) && $payload[$field] !== '') {
            return $payload[$field];
        }
    }
    return $fallback;
}

function jsonPayload(string $payload): mixed
{
    return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
}

/** @return list<string> */
function publicResources(): array
{
    return ['conferences', 'categories', 'faqs', 'gallery', 'statistics', 'testimonials'];
}

/** @return list<string> */
function userResources(): array
{
    return ['abstracts', 'certificates', 'notifications', 'registrations', 'userProfile'];
}

/** @param array<string, mixed> $user */
function isAdmin(array $user): bool
{
    return in_array($user['role'] ?? null, ['ADMIN', 'SUPER_ADMIN'], true);
}

/** @return array<string, mixed> */
function requireUser(): array
{
    $user = sessionUser(bearerToken());
    if (!$user) {
        errorResponse('Authentication required.', 401);
    }
    return $user;
}

/** @return array<string, mixed> */
function requireAdmin(): array
{
    $user = requireUser();
    if (!isAdmin($user)) {
        errorResponse('Administrator access required.', 403);
    }
    return $user;
}

/** @param array<string, mixed> $payload @param array<string, mixed> $user */
function belongsToUser(string $resource, array $payload, array $user): bool
{
    $ownerId = $payload['userId'] ?? ($resource === 'userProfile' ? ($payload['id'] ?? null) : null);
    return is_string($ownerId) && hash_equals((string) $user['id'], $ownerId);
}

function passwordRecoveryUnavailable(): never
{
    errorResponse('Password recovery is not configured. Contact the site administrator.', 501);
}

function configureCors(): void
{
    header('Access-Control-Allow-Origin: ' . config('FRONTEND_ORIGIN', 'http://localhost:5173'));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        respond(null, 204);
    }
}

configureCors();

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

    if ($method === 'GET' && $path === '/api/health') {
        connection()->query('SELECT 1');
        respond(['status' => 'ok', 'database' => 'connected']);
    }

    if ($method === 'POST' && $path === '/api/auth/register') {
        $input = body();
        $name = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            errorResponse('Name, valid email, and an 8-character password are required.', 400);
        }
        $find = connection()->prepare('SELECT id FROM `User` WHERE email = ?');
        $find->execute([$email]);
        if ($find->fetch()) {
            errorResponse('An account with this email already exists.', 409);
        }
        $user = ['id' => newId(), 'name' => $name, 'email' => $email, 'role' => 'USER', 'avatar' => null];
        connection()->prepare('INSERT INTO `User` (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))')
            ->execute([$user['id'], $name, $email, password_hash($password, PASSWORD_DEFAULT), 'USER']);
        respond(['token' => createSession($user['id']), 'user' => publicUser($user)], 201);
    }

    if ($method === 'POST' && $path === '/api/auth/login') {
        $input = body();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        $statement = connection()->prepare('SELECT * FROM `User` WHERE email = ?');
        $statement->execute([$email]);
        $user = $statement->fetch();
        if (!$user || !password_verify($password, $user['passwordHash'])) {
            errorResponse('Invalid email or password.', 401);
        }
        respond(['token' => createSession($user['id']), 'user' => publicUser($user)]);
    }

    if ($method === 'GET' && $path === '/api/auth/me') {
        $user = sessionUser(bearerToken());
        if (!$user) {
            errorResponse('Authentication required.', 401);
        }
        respond(['user' => publicUser($user)]);
    }

    if ($method === 'POST' && $path === '/api/auth/logout') {
        if ($token = bearerToken()) {
            connection()->prepare('DELETE FROM `Session` WHERE tokenHash = ?')->execute([tokenHash($token)]);
        }
        respond(null, 204);
    }

    if ($method === 'POST' && $path === '/api/auth/forgot-password') {
        passwordRecoveryUnavailable();
    }

    if ($method === 'POST' && $path === '/api/auth/reset-password') {
        passwordRecoveryUnavailable();
    }

    if ($method === 'GET' && $path === '/api/users') {
        requireAdmin();
        $users = connection()->query('SELECT id, name, email, role, avatar FROM `User` ORDER BY createdAt DESC')->fetchAll();
        respond(array_map('publicUser', $users));
    }

    if ($method === 'GET' && $path === '/api/data/snapshot') {
        $user = sessionUser(bearerToken());
        $admin = $user !== null && isAdmin($user);
        $records = connection()->query('SELECT resource, payload FROM `DataRecord` ORDER BY resource ASC, recordKey ASC')->fetchAll();
        $snapshot = [];
        foreach ($records as $record) {
            $resource = $record['resource'];
            $payload = jsonPayload($record['payload']);
            if (in_array($resource, publicResources(), true)) {
                $snapshot[$resource][] = $payload;
                continue;
            }
            if ($admin) {
                $snapshot[$resource][] = $payload;
                continue;
            }
            if ($user !== null
                && in_array($resource, userResources(), true)
                && is_array($payload)
                && belongsToUser($resource, $payload, $user)) {
                $snapshot[$resource][] = $payload;
            }
        }
        respond($snapshot);
    }

    if (preg_match('#^/api/data/([^/]+)$#', $path, $matches)) {
        $resource = rawurldecode($matches[1]);
        if ($method === 'GET') {
            if (!in_array($resource, publicResources(), true)) {
                $user = requireUser();
                if (!isAdmin($user) && !in_array($resource, userResources(), true)) {
                    errorResponse('Administrator access required.', 403);
                }
            } else {
                $user = sessionUser(bearerToken());
            }
            $statement = connection()->prepare('SELECT payload FROM `DataRecord` WHERE resource = ? ORDER BY recordKey ASC');
            $statement->execute([$resource]);
            $items = array_map(fn(array $record) => jsonPayload($record['payload']), $statement->fetchAll());
            if (isset($user) && !isAdmin($user) && in_array($resource, userResources(), true)) {
                $items = array_values(array_filter(
                    $items,
                    fn(mixed $item): bool => is_array($item) && belongsToUser($resource, $item, $user)
                ));
            }
            respond($items);
        }
        if ($method === 'POST') {
            $payload = body();
            $user = requireUser();
            if (!isAdmin($user)) {
                if ($resource !== 'abstracts' || !belongsToUser($resource, $payload, $user)) {
                    errorResponse('Administrator access required.', 403);
                }
                $payload['userId'] = $user['id'];
                $payload['status'] = 'SUBMITTED';
                unset($payload['reviewer'], $payload['reviewerComments'], $payload['reviewedAt']);
            }
            $key = recordKey($payload, $resource . '-' . (int) floor(microtime(true) * 1000));
            $encoded = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            if (!isAdmin($user)) {
                $existing = connection()->prepare('SELECT payload FROM `DataRecord` WHERE resource = ? AND recordKey = ?');
                $existing->execute([$resource, $key]);
                if ($existing->fetch()) {
                    errorResponse('This record already exists.', 409);
                }
                connection()->prepare('INSERT INTO `DataRecord` (id, resource, recordKey, payload, updatedAt) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))')
                    ->execute([$resource . ':' . $key, $resource, $key, $encoded]);
            } else {
                connection()->prepare('INSERT INTO `DataRecord` (id, resource, recordKey, payload, updatedAt) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updatedAt = UTC_TIMESTAMP(3)')
                    ->execute([$resource . ':' . $key, $resource, $key, $encoded]);
            }
            respond($payload, 201);
        }
    }

    if (preg_match('#^/api/data/([^/]+)/([^/]+)$#', $path, $matches)) {
        $resource = rawurldecode($matches[1]);
        $key = rawurldecode($matches[2]);
        if ($method === 'PUT') {
            $payload = body();
            $user = requireUser();
            if (!isAdmin($user)) {
                if ($resource === 'userProfile' && hash_equals((string) $user['id'], $key)) {
                    $allowedFields = ['name', 'phone', 'organization', 'jobTitle', 'country', 'city', 'biography', 'interests', 'linkedin', 'website'];
                    if (!is_string($payload['name'] ?? null)) {
                        errorResponse('A profile name is required.', 400);
                    }
                    $profile = ['id' => $user['id'], 'name' => trim($payload['name']), 'email' => $user['email']];
                    foreach ($allowedFields as $field) {
                        if ($field !== 'name' && array_key_exists($field, $payload)) {
                            $profile[$field] = $payload[$field];
                        }
                    }
                    if (strlen($profile['name']) < 2) {
                        errorResponse('Name must contain at least 2 characters.', 400);
                    }
                    $encodedProfile = json_encode($profile, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                    connection()->prepare('INSERT INTO `DataRecord` (id, resource, recordKey, payload, updatedAt) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updatedAt = UTC_TIMESTAMP(3)')
                        ->execute(['userProfile:' . $user['id'], 'userProfile', $user['id'], $encodedProfile]);
                    respond($profile);
                }
                if ($resource === 'notifications') {
                    $existing = connection()->prepare('SELECT payload FROM `DataRecord` WHERE resource = ? AND recordKey = ?');
                    $existing->execute([$resource, $key]);
                    $current = $existing->fetch();
                    $currentPayload = $current ? jsonPayload($current['payload']) : null;
                    if (!is_array($currentPayload) || !belongsToUser($resource, $currentPayload, $user)) {
                        errorResponse('Record not found.', 404);
                    }
                    if (!is_bool($payload['read'] ?? null)) {
                        errorResponse('A boolean read value is required.', 400);
                    }
                    $currentPayload['read'] = $payload['read'];
                    $encodedNotification = json_encode($currentPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                    connection()->prepare('UPDATE `DataRecord` SET payload = ?, updatedAt = UTC_TIMESTAMP(3) WHERE resource = ? AND recordKey = ?')
                        ->execute([$encodedNotification, $resource, $key]);
                    respond($currentPayload);
                }
                errorResponse('Administrator access required.', 403);
            }
            $encoded = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $statement = connection()->prepare('UPDATE `DataRecord` SET payload = ?, updatedAt = UTC_TIMESTAMP(3) WHERE resource = ? AND recordKey = ?');
            $statement->execute([$encoded, $resource, $key]);
            if ($statement->rowCount() === 0) {
                $exists = connection()->prepare('SELECT id FROM `DataRecord` WHERE resource = ? AND recordKey = ?');
                $exists->execute([$resource, $key]);
                if (!$exists->fetch()) {
                    errorResponse("Record \"{$key}\" not found.", 404);
                }
            }
            respond($payload);
        }
        if ($method === 'DELETE') {
            $user = requireUser();
            if (!isAdmin($user)) {
                if ($resource !== 'notifications') {
                    errorResponse('Administrator access required.', 403);
                }
                $existing = connection()->prepare('SELECT payload FROM `DataRecord` WHERE resource = ? AND recordKey = ?');
                $existing->execute([$resource, $key]);
                $current = $existing->fetch();
                $currentPayload = $current ? jsonPayload($current['payload']) : null;
                if (!is_array($currentPayload) || !belongsToUser($resource, $currentPayload, $user)) {
                    errorResponse('Record not found.', 404);
                }
            }
            $statement = connection()->prepare('DELETE FROM `DataRecord` WHERE resource = ? AND recordKey = ?');
            $statement->execute([$resource, $key]);
            if ($statement->rowCount() === 0) {
                errorResponse("Record \"{$key}\" not found.", 404);
            }
            respond(null, 204);
        }
    }

    errorResponse('Route not found.', 404);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    errorResponse('Database request failed.', 500);
} catch (JsonException $exception) {
    error_log($exception->getMessage());
    errorResponse('Could not encode or decode JSON.', 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    errorResponse('Server error.', 500);
}
