package controllers

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/service"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// 日志控制层结构体
type QSLController struct {
	qslService service.QSLInterface
}

func (c QSLController) QSLList(context *gin.Context) {
	qsls, _ := service.QSLServices.QSLList(context)
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "查询成功！",
		"data":    qsls,
	})
}

func (c QSLController) QSLDelete(context *gin.Context) {
	qslId := context.Query("id")
	fmt.Println(qslId)
	if qslId == "" {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": "缺少参数：id",
		})
		return
	}
	err := service.QSLServices.QSLDelete(qslId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": fmt.Sprintf("删除失败：%v", err),
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "删除成功！",
	})
}

// 用户QSL卡上传
func (uc *QSLController) QSLUpload(context *gin.Context) {
	// 获取当前用户ID
	userID := context.GetInt("user_id")
	if userID == 0 {
		context.JSON(http.StatusUnauthorized, gin.H{
			"code":    http.StatusUnauthorized,
			"message": "请先登录",
		})
		return
	}
	// 获取上传的文件
	file, err := context.FormFile("file")
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": "获取文件失败: " + err.Error(),
		})
		return
	}
	// 检查文件大小
	if err := checkFileSize(file); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}
	// 检查文件类型
	if err := checkFileExtension(file.Filename); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}
	// 生成新的文件名
	newFileName := generateQSLFileName(userID, file.Filename)
	// 确保上传目录存在
	uploadDir := "./upload/"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": "创建上传目录失败: " + err.Error(),
		})
		return
	}
	// 保存文件
	dst := filepath.Join(uploadDir, newFileName)
	if err := context.SaveUploadedFile(file, dst); err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": "保存文件失败: " + err.Error(),
		})
		return
	}
	// 更新用户QSL卡信息
	err = service.QSLServices.UpdateUserQSL(userID, newFileName)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": "更新用户信息失败: " + err.Error(),
		})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "上传成功",
		"data": gin.H{
			"filename": newFileName,
			"path":     "/upload/qsl/" + newFileName,
		},
	})
}

// 生成QSL文件名
func generateQSLFileName(userID int, originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	timestamp := time.Now().Format("2006-01-02-15-04-05")
	return fmt.Sprintf("qsl_%d_%s%s", userID, timestamp, ext)
}

// 检查文件大小
func checkFileSize(file *multipart.FileHeader) error {
	if file.Size > MaxFileSize {
		return errors.New("文件大小超过限制")
	}
	return nil
}

// 检查文件后缀是否合法
func checkFileExtension(fileName string) error {
	// 获取文件后缀
	fileExt := getFileExtension(fileName)
	// 检查后缀是否在允许的列表中
	for _, allowedExt := range AllowedFileExtensions {
		if strings.ToLower(fileExt) == allowedExt {
			return nil
		}
	}
	return errors.New("不允许的文件后缀名")
}
