/**
 * @file /src/services/__tests__/user-address.contract.test.ts
 * @description Fige le contrat API réel des modules `/users` et `/addresses`.
 *
 * Ces tests ne valident pas l'UI : ils valident le BODY EFFECTIFLEMENT ENVOYÉ
 * sur le wire, qui est la cause racine du P0 (`fullName` envoyé au lieu de
 * `full_name` → ignoré silencieusement par le backend → 200 trompeur).
 *
 * Contrat gravé ici, à relire si le backend change :
 *   PATCH /api/v1/users/me      → snake_case : full_name, username, email, phone
 *   GET   /api/v1/users/me      → snake_case : full_name, created_at, …
 *   POST  /api/v1/addresses/    → snake_case, 5 champs requis, jamais user_id
 *   PUT   /api/v1/addresses/{id} → payload COMPLET (AddressCreate)
 *   PATCH /api/v1/addresses/{id}/default → AUCUN body
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';
import { AddressService } from '@/services/address.service';
import { UserService } from '@/services/user.service';

vi.mock('@/lib/api', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: api, api, apiClient: api, apiUtils: { handleApiError: vi.fn() } };
});

const mock = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

// ─── /users/me ──────────────────────────────────────────────────────────────

describe('UserService — contrat /api/v1/users/me (snake_case)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.patch.mockResolvedValue({ data: { id: 1, full_name: 'Salioungom ibn' } });
  });

  it('PATCH /users/me envoie full_name et NON fullName', async () => {
    await UserService.updateProfile({
      fullName: 'Salioungom ibn',
      username: 'salioungom',
      email: 's@example.sn',
      phone: '+221785958076',
    });

    const [url, body] = mock.patch.mock.calls[0];

    expect(url).toBe('/api/v1/users/me');
    // La clé qui était ignorée par le backend (cause du P0) :
    expect(body).toHaveProperty('full_name', 'Salioungom ibn');
    expect(body).not.toHaveProperty('fullName');
  });

  it('PATCH /users/me n’envoie que les 4 champs déclarés', async () => {
    await UserService.updateProfile({
      fullName: 'Salioungom ibn',
      username: 'salioungom',
      email: 's@example.sn',
      phone: '+221785958076',
    });

    const body = mock.patch.mock.calls[0][1];

    // `required: []` côté backend, mais extra="forbid" est annoncé : tout champ
    // non déclaré deviendrait un 422. On verrouille donc le jeu de clés exact.
    expect(Object.keys(body).sort()).toEqual(['email', 'full_name', 'phone', 'username']);
    // Champs explicitement exclus par le schéma UserUpdate :
    for (const forbidden of ['name', 'address', 'user_id', 'id', 'createdAt', 'created_at', 'role']) {
      expect(body).not.toHaveProperty(forbidden);
    }
  });

  it('PATCH /users/me laisse remonter le detail d’un 422', async () => {
    const detail = [
      { loc: ['body', 'username'], msg: 'String should have at least 3 characters' },
    ];
    mock.patch.mockRejectedValue({ response: { status: 422, data: { detail } } });

    // La propagation doit conserver l'erreur axios : sans cela, le `detail` du
    // backend était écrasé par un message générique (bug masqué).
    await expect(
      UserService.updateProfile({ fullName: 'A B', username: 'a', email: 'a@b.sn', phone: '+221785958076' })
    ).rejects.toMatchObject({ response: { status: 422, data: { detail } } });
  });

  it('GET /users/me est lu tel quel (full_name, pas fullName)', async () => {
    mock.get.mockResolvedValue({
      data: { id: 1, full_name: 'Salioungom ibn', username: 'salioungom', created_at: '2024-01-01T00:00:00Z' },
    });

    const profile = await UserService.getCurrentProfile();

    expect(mock.get.mock.calls[0][0]).toBe('/api/v1/users/me');
    expect(profile.full_name).toBe('Salioungom ibn');
    expect(profile.username).toBe('salioungom');
    expect(profile.created_at).toBe('2024-01-01T00:00:00Z');
  });
});

// ─── /addresses ─────────────────────────────────────────────────────────────

describe('AddressService — contrat /api/v1/addresses (snake_case)', () => {
  const profilePayload = {
    addressType: 'billing' as const,
    addressLine1: 'dakar hlm',
    city: 'Dakar',
    firstName: 'Salioungom',
    lastName: 'ibn',
    phone: '+221785958076',
    isDefault: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mock.post.mockResolvedValue({ data: { id: 7, address_line_1: 'dakar hlm' } });
    mock.put.mockResolvedValue({ data: { id: 7, address_line_1: 'dakar hlm' } });
    mock.patch.mockResolvedValue({ data: { id: 7, is_default: true } });
  });

  it('POST /addresses/ envoie les clés snake_case attendues', async () => {
    await AddressService.saveProfileAddress(null, profilePayload);

    const [url, body] = mock.post.mock.calls[0];

    expect(url).toBe('/api/v1/addresses/');
    expect(body).toEqual({
      address_type: 'billing',
      address_line_1: 'dakar hlm',
      address_line_2: undefined,
      city: 'Dakar',
      state: undefined,
      first_name: 'Salioungom',
      last_name: 'ibn',
      phone: '+221785958076',
      delivery_instructions: undefined,
      is_default: true,
    });
  });

  it('POST /addresses/ n’envoie ni user_id, ni full_name, ni landmark', async () => {
    await AddressService.saveProfileAddress(null, profilePayload);
    const body = mock.post.mock.calls[0][1];

    for (const forbidden of ['user_id', 'full_name', 'landmark', 'addressLine1', 'firstName', 'lastName', 'isDefault', 'addressType']) {
      expect(body).not.toHaveProperty(forbidden);
    }
  });

  it('POST /addresses/ envoie les 5 champs requis (sinon 422)', async () => {
    await AddressService.saveProfileAddress(null, profilePayload);
    const body = mock.post.mock.calls[0][1];

    for (const required of ['address_line_1', 'city', 'first_name', 'last_name', 'phone']) {
      expect(body[required]).toBeTruthy();
    }
  });

  it('PUT /addresses/{id} reçoit un payload COMPLET', async () => {
    await AddressService.saveProfileAddress({ id: 7 } as never, profilePayload);

    const [url, body] = mock.put.mock.calls[0];
    expect(url).toBe('/api/v1/addresses/7');
    // Le backend réutilise AddressCreate sur le PUT : un body partiel = 422.
    for (const required of ['address_line_1', 'city', 'first_name', 'last_name', 'phone']) {
      expect(body).toHaveProperty(required);
      expect(body[required]).toBeTruthy();
    }
    expect(mock.post).not.toHaveBeenCalled();
  });

  it('PATCH /addresses/{id}/default est appelé SANS body', async () => {
    await AddressService.saveProfileAddress(null, profilePayload);

    const defaultCall = mock.patch.mock.calls.find((c) => String(c[0]).endsWith('/default'));
    expect(defaultCall).toBeDefined();
    expect(defaultCall![0]).toBe('/api/v1/addresses/7/default');
    expect(defaultCall![1]).toBeUndefined();
  });

  it('ne compare jamais le phone renvoyé à la saisie brute (normalisation E.164)', () => {
    // Garde-fou documentaire : le backend normalise 0779322021 → +221779322021.
    // Toute comparaison d'égalité entre la valeur renvoyée et la saisie casserait.
    const saved = { id: 7, phone: '+221779322021' };
    const saisie = '0779322021';
    expect(saved.phone === saisie).toBe(false);
  });
});
