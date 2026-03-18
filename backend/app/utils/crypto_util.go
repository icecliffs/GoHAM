package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"github.com/tjfoc/gmsm/sm2"
	"hamlog/app/config/yaml"
	"math/big"
)

var (
	privateKey *sm2.PrivateKey
	publicKey  *sm2.PublicKey
)

func init() {
	PrivateKeyHex := yaml.GetConfig().Hamlog.Sm2PrivateKey
	privKeyBytes, err := hex.DecodeString(PrivateKeyHex)
	if err != nil {
		panic(fmt.Sprintf("解码私钥失败: %v", err))
	}
	if len(privKeyBytes) != 32 {
		panic("私钥长度必须为32字节")
	}
	privateKey = new(sm2.PrivateKey)
	privateKey.D = new(big.Int).SetBytes(privKeyBytes)
	privateKey.Curve = sm2.P256Sm2()
	privateKey.PublicKey.Curve = sm2.P256Sm2()
	privateKey.PublicKey.X, privateKey.PublicKey.Y = privateKey.Curve.ScalarBaseMult(privKeyBytes)
	publicKey = &privateKey.PublicKey
}
func EncryptString(plaintext string) (string, error) {
	ciphertext, err := publicKey.EncryptAsn1([]byte(plaintext), rand.Reader)
	if err != nil {
		return "", fmt.Errorf("加密失败: %v", err)
	}
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}
func DecryptString(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("Base64解码失败: %v", err)
	}
	plaintext, err := privateKey.DecryptAsn1(data)
	if err != nil {
		return "", fmt.Errorf("解密失败: %v", err)
	}
	return string(plaintext), nil
}
