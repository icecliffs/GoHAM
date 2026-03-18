package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/service"
	"hamlog/app/utils"
	"net/http"
)

const MaxFileSize = 10 << 20 // 10MB
var AllowedFileExtensions = []string{"jpg", "png"}

type UserController struct {
	userService service.UserInterface
}

// 列出所有用户
func (uc *UserController) UserList(context *gin.Context) {
	users, err := service.UserServices.UserList()
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": users,
	})
}

// 查询所有用户
func (uc *UserController) UserLog(context *gin.Context) {
	userId := context.Query("id")
	users, err := service.UserServices.UserLog(userId)
	fmt.Println(users)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": users,
	})
}

// 删除一个用户
func (uc *UserController) UserDelete(context *gin.Context) {
	userId := context.Query("id")
	_, err := service.UserServices.UserDelete(userId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": "删除成功！",
	})
}

// 更新一个用户
func (uc *UserController) UserUpdate(context *gin.Context) {
	userId := context.Query("id")
	username := context.Query("username")
	callsign := context.Query("callsign")
	email := context.Query("email")
	otp := context.Query("otp")
	_, err := service.UserServices.UserUpdate(userId, username, callsign, email, otp)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": "更新成功！",
	})
}

// 用户登出
func (uc *UserController) UserLogout(context *gin.Context) {

}

// 用户登录
func (uc *UserController) UserLogin(context *gin.Context) {
	var loginData struct {
		Username string `json:"username" binding:"required"`
		OTP      string `json:"otp" binding:"required"`
	}

	// 尝试解析请求 JSON
	if err := context.ShouldBindJSON(&loginData); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": "请求格式错误: " + err.Error(),
		})
		return
	}
	// 登录逻辑
	user, err := service.UserServices.UserLogin(loginData.Username, loginData.OTP)
	if err != nil {
		context.JSON(http.StatusUnauthorized, gin.H{
			"code":    http.StatusUnauthorized,
			"message": err.Error(),
		})
		return
	}
	// 生成 JWT
	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": "Token生成失败: " + err.Error(),
		})
		return
	}
	// 登录成功后不返回 OTP 字段
	user.Opt = ""
	// 返回数据
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "登录成功",
		"data": gin.H{
			"token": token,
			"user":  user,
		},
	})
}

// 获取当前用户信息
func (uc *UserController) GetCurrentUser(context *gin.Context) {
	userID := context.GetInt("user_id")
	fmt.Printf("当前ID：%s", userID)
	user, err := service.UserServices.GetUserByID(userID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": "Failed to get user information",
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Success",
		"data":    user,
	})
}

// 用户编辑
func (uc *UserController) UserChange(context *gin.Context) {
	userId := context.Query("id")
	userData := service.User{}
	context.BindJSON(&userData)
	users, err := service.UserServices.UserChange(userData, userId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": err.Error(),
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "修改成功！",
		"data":    users,
	})
}

// 用户生成OTP
func (uc *UserController) GenerateUserOTP(context *gin.Context) {
	otpCode, _ := service.UserServices.GetOTPCode(context.Query("email"))
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "获取成功",
		"data":    otpCode,
	})
}

// GetUserQSLs 获取用户的所有QSL卡
func (uc *UserController) GetUserQSLs(context *gin.Context) {
	userID := context.GetInt("user_id")
	if userID == 0 {
		context.JSON(http.StatusUnauthorized, gin.H{
			"code":    http.StatusUnauthorized,
			"message": "请先登录",
		})
		return
	}

	qslFiles, err := service.UserServices.GetUserQSLs(userID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": err.Error(),
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "获取成功",
		"data":    qslFiles,
	})
}

// 用户添加
func (uc *UserController) UserRegister(context *gin.Context) {
	// 从请求中获取参数（建议使用 POST + JSON）
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Callsign string `json:"callsign"`
		Otp      string `json:"otp"`
	}

	if err := context.ShouldBindJSON(&req); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": "请求参数错误",
		})
		return
	}

	// 调用服务层注册方法
	msg, err := service.UserServices.UserRegister(req.Username, req.Email, req.Callsign, req.Otp)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"message": err.Error(),
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": msg,
	})
}
