import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getKeySettings as fetchKeySettings,
  updateKeyMode as apiUpdateKeyMode,
  getDiariesForReEncrypt,
  batchUpdateReEncryptedDiaries,
} from "../lib/keyManagement";
import type {
  KeyMode,
  KeyModeUpdateRequest,
  DiaryReEncryptRequest,
} from "../lib/keyManagement";
import {
  deriveKey,
  deriveKeyBytes,
  encryptText,
  decryptText,
  generateSalt,
  bytesToBase64,
  base64ToBytes,
  importRsaOaepPublicKeyFromSpkiBase64,
  rsaOaepEncryptToBase64,
} from "../lib/crypto";

interface EncryptionState {
  // 当前密钥设置
  keyMode: KeyMode | null;
  hasCloudBackup: boolean;
  keySalt: string | null;
  backupPublicKey: string | null;

  // 运行时密钥（不持久化）
  cryptoKey: CryptoKey | null;

  // 自定义密钥模式：本地保存的密码（可选，用户选择"记住密码"时使用）
  savedPassword: string | null;

  // 状态
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setCustomPassword: (password: string, remember?: boolean) => Promise<void>;
  clearPassword: () => void;

  // 加解密方法
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (ciphertext: string) => Promise<string>;

  // 密钥模式切换
  switchToDefaultMode: () => Promise<void>;
  switchToCustomMode: (
    password: string,
    enableCloudBackup?: boolean,
  ) => Promise<void>;
  changeCustomPassword: (
    oldPassword: string,
    newPassword: string,
    enableCloudBackup?: boolean,
  ) => Promise<void>;

  // 辅助方法
  hasActiveKey: () => boolean;
  reset: () => void;
}

export const useEncryptionStore = create<EncryptionState>()(
  persist(
    (set, get) => ({
      keyMode: null,
      hasCloudBackup: false,
      keySalt: null,
      backupPublicKey: null,
      cryptoKey: null,
      savedPassword: null,
      isInitialized: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });
        try {
          const settings = await fetchKeySettings();
          set({
            keyMode: settings.keyMode,
            hasCloudBackup: settings.hasCloudBackup,
            keySalt: settings.keySalt || null,
            backupPublicKey: settings.backupPublicKey || null,
          });

          if (settings.keyMode === "CUSTOM" && settings.keySalt) {
            const savedPassword = get().savedPassword;
            if (savedPassword) {
              const salt = base64ToBytes(settings.keySalt);
              const key = await deriveKey(savedPassword, salt);
              set({ cryptoKey: key });
            }
          }

          set({ isInitialized: true });
        } catch (error) {
          set({ error: "无法加载密钥设置" });
          console.error("Failed to initialize encryption:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      setCustomPassword: async (password: string, remember = false) => {
        const { keySalt } = get();
        if (!keySalt) {
          set({ error: "密钥盐值不存在" });
          return;
        }

        try {
          const salt = base64ToBytes(keySalt);
          const key = await deriveKey(password, salt);
          set({
            cryptoKey: key,
            savedPassword: remember ? password : null,
          });
        } catch (error) {
          set({ error: "密码解锁失败" });
          console.error("Failed to derive key:", error);
        }
      },

      clearPassword: () => {
        set({ cryptoKey: null, savedPassword: null });
      },

      encrypt: async (plaintext: string): Promise<string> => {
        if (get().keyMode === "DEFAULT") {
          return plaintext;
        }
        const { cryptoKey } = get();
        if (!cryptoKey) {
          throw new Error("加密密钥未就绪，请先解锁");
        }
        return encryptText(plaintext, cryptoKey);
      },

      decrypt: async (ciphertext: string): Promise<string> => {
        if (get().keyMode === "DEFAULT") {
          return ciphertext;
        }
        const { cryptoKey } = get();
        if (!cryptoKey) {
          throw new Error("解密密钥未就绪，请先解锁");
        }
        try {
          return await decryptText(ciphertext, cryptoKey);
        } catch (error) {
          console.error("Decryption failed:", error);
          throw new Error("解密失败，可能密钥不正确");
        }
      },

      switchToDefaultMode: async () => {
        set({ isLoading: true, error: null });
        try {
          // 1. 获取所有日记
          const diaries = await getDiariesForReEncrypt();

          // 2. 切换为 DEFAULT 模式
          const request: KeyModeUpdateRequest = { keyMode: "DEFAULT" };
          await apiUpdateKeyMode(request);

          // 3. 使用旧密钥解密，上传明文给服务端（服务端使用环境变量密钥加密落库）
          const oldKey = get().cryptoKey;
          const reEncryptedDiaries: DiaryReEncryptRequest["diaries"] = [];

          for (const diary of diaries) {
            let content = diary.content;
            // 如果有旧密钥，先解密
            if (oldKey && diary.content) {
              try {
                content = await decryptText(diary.content, oldKey);
              } catch {
                // 可能是未加密内容或旧格式，保持原样
                console.warn("Could not decrypt diary:", diary.diaryId);
              }
            }
            reEncryptedDiaries.push({
              diaryId: diary.diaryId,
              encryptedContent: content,
            });
          }

          // 4. 批量更新
          if (reEncryptedDiaries.length > 0) {
            await batchUpdateReEncryptedDiaries({
              diaries: reEncryptedDiaries,
              newKeyMode: "DEFAULT",
            });
          }

          // 5. 更新状态
          set({
            keyMode: "DEFAULT",
            hasCloudBackup: false,
            keySalt: null,
            cryptoKey: null,
            savedPassword: null,
          });
        } catch (error) {
          set({ error: "切换到默认密钥模式失败" });
          console.error("Failed to switch to default mode:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      switchToCustomMode: async (
        password: string,
        enableCloudBackup = false,
      ) => {
        set({ isLoading: true, error: null });
        try {
          // 1. 生成新盐值
          const salt = generateSalt();
          const saltBase64 = bytesToBase64(salt);

          // 2. 派生新密钥
          const newKey = await deriveKey(password, salt);

          // 3. 获取所有日记
          const diaries = await getDiariesForReEncrypt();

          // 4. 使用旧密钥解密，新密钥加密
          const oldKey = get().cryptoKey;
          const reEncryptedDiaries: DiaryReEncryptRequest["diaries"] = [];

          for (const diary of diaries) {
            let content = diary.content;
            if (oldKey && diary.content) {
              try {
                content = await decryptText(diary.content, oldKey);
              } catch {
                console.warn("Could not decrypt diary:", diary.diaryId);
              }
            }
            const encryptedContent = await encryptText(content, newKey);
            reEncryptedDiaries.push({
              diaryId: diary.diaryId,
              encryptedContent,
            });
          }

          // 5. 准备备份密钥（如果开启云端备份）
          let encryptedBackupKey: string | undefined;
          if (enableCloudBackup) {
            const { backupPublicKey } = get();
            if (!backupPublicKey) {
              throw new Error("备份公钥获取失败");
            }
            const keyBytes = await deriveKeyBytes(password, salt);
            const publicKey =
              await importRsaOaepPublicKeyFromSpkiBase64(backupPublicKey);
            encryptedBackupKey = await rsaOaepEncryptToBase64(
              keyBytes,
              publicKey,
            );
          }

          // 6. 批量更新
          await batchUpdateReEncryptedDiaries({
            diaries: reEncryptedDiaries,
            newKeyMode: "CUSTOM",
            newKeySalt: saltBase64,
            enableCloudBackup,
            encryptedBackupKey,
          });

          // 7. 更新状态
          set({
            keyMode: "CUSTOM",
            hasCloudBackup: enableCloudBackup,
            keySalt: saltBase64,
            cryptoKey: newKey,
            savedPassword: null, // 不自动保存自定义密码
          });
        } catch (error) {
          set({ error: "切换到自定义密钥模式失败" });
          console.error("Failed to switch to custom mode:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      changeCustomPassword: async (
        oldPassword: string,
        newPassword: string,
        enableCloudBackup = false,
      ) => {
        const { keySalt } = get();
        if (!keySalt) {
          throw new Error("当前不是自定义密钥模式");
        }

        set({ isLoading: true, error: null });
        try {
          // 1. 验证旧密码
          const oldSalt = base64ToBytes(keySalt);
          const oldKey = await deriveKey(oldPassword, oldSalt);

          // 2. 生成新盐值和密钥
          const newSalt = generateSalt();
          const newSaltBase64 = bytesToBase64(newSalt);
          const newKey = await deriveKey(newPassword, newSalt);

          // 3. 获取所有日记并重新加密
          const diaries = await getDiariesForReEncrypt();
          const reEncryptedDiaries: DiaryReEncryptRequest["diaries"] = [];

          for (const diary of diaries) {
            let content = diary.content;
            if (diary.content) {
              try {
                content = await decryptText(diary.content, oldKey);
              } catch {
                console.warn("Could not decrypt diary:", diary.diaryId);
              }
            }
            const encryptedContent = await encryptText(content, newKey);
            reEncryptedDiaries.push({
              diaryId: diary.diaryId,
              encryptedContent,
            });
          }

          // 4. 准备备份密钥
          let encryptedBackupKey: string | undefined;
          if (enableCloudBackup) {
            const { backupPublicKey } = get();
            if (!backupPublicKey) {
              throw new Error("备份公钥获取失败");
            }
            const keyBytes = await deriveKeyBytes(newPassword, newSalt);
            const publicKey =
              await importRsaOaepPublicKeyFromSpkiBase64(backupPublicKey);
            encryptedBackupKey = await rsaOaepEncryptToBase64(
              keyBytes,
              publicKey,
            );
          }

          // 5. 批量更新
          await batchUpdateReEncryptedDiaries({
            diaries: reEncryptedDiaries,
            newKeyMode: "CUSTOM",
            newKeySalt: newSaltBase64,
            enableCloudBackup,
            encryptedBackupKey,
          });

          // 6. 更新状态
          set({
            keySalt: newSaltBase64,
            hasCloudBackup: enableCloudBackup,
            cryptoKey: newKey,
            savedPassword: null,
          });
        } catch (error) {
          set({ error: "密码更换失败" });
          console.error("Failed to change password:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      hasActiveKey: () => {
        return get().keyMode === "DEFAULT" || get().cryptoKey !== null;
      },

      reset: () => {
        set({
          keyMode: null,
          hasCloudBackup: false,
          keySalt: null,
          backupPublicKey: null,
          cryptoKey: null,
          savedPassword: null,
          isInitialized: false,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "yusi-encryption-storage",
      partialize: (state) => ({
        // 只持久化必要的状态，不持久化 cryptoKey
        keyMode: state.keyMode,
        hasCloudBackup: state.hasCloudBackup,
        keySalt: state.keySalt,
        backupPublicKey: state.backupPublicKey,
        savedPassword: state.savedPassword,
      }),
    },
  ),
);
