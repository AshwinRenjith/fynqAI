
import { sendMessageToGemini, uploadImageToGemini, uploadFile } from './api';

describe('api.ts', () => {
  const OLD_FETCH = global.fetch;
  const OLD_LOCALSTORAGE = global.localStorage;
  let fetchMock: jest.Mock;
  let localStorageMock: any;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    localStorageMock = {
      getItem: jest.fn(() => 'test-jwt-token'),
    };
    global.localStorage = localStorageMock;
  });

  afterEach(() => {
    global.fetch = OLD_FETCH;
    global.localStorage = OLD_LOCALSTORAGE;
    jest.clearAllMocks();
  });

  it('sendMessageToGemini attaches JWT and calls correct endpoint', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }), status: 200 });
    await sendMessageToGemini('hi');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/chat/message'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });

  it('sendMessageToGemini handles 401/403 and calls onAuthError', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const onAuthError = jest.fn();
    await expect(sendMessageToGemini('hi', undefined, onAuthError)).rejects.toThrow('Authentication required');
    expect(onAuthError).toHaveBeenCalled();
  });

  it('uploadImageToGemini attaches JWT and calls correct endpoint', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }), status: 200 });
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    await uploadImageToGemini(file);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/chat/image'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });

  it('uploadFile attaches JWT and calls correct endpoint', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }), status: 200 });
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    await uploadFile(file);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/files/upload'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });
});
