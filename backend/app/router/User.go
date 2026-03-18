package router

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/controllers"
	"hamlog/app/middleware"
)

// UserRouter 用于配置与用户相关的路由
func UserRouter(r *gin.Engine) {
	// 创建 UserController 实例
	userController := &controllers.UserController{}
	// 定义用户相关的路由组
	userGroup := r.Group("/api/v1/user")
	{
		// 用户登录
		userGroup.POST("/login", userController.UserLogin)
		// 用户资料修改
		userGroup.PUT("/change", userController.UserChange)
		// 用户登出
		userGroup.GET("/logout", userController.UserLogout)
	}
	// 需要认证的路由组
	authGroup := r.Group("/api/v1/user/")
	authGroup.GET("otp", userController.GenerateUserOTP)
	authGroup.Use(middleware.JWTAuth())
	{
		// 获取当前用户信息
		authGroup.GET("current", userController.GetCurrentUser)
		// 注册用户
		authGroup.POST("register", userController.UserRegister)
		// 列出所有用户
		authGroup.GET("list", userController.UserList)
		// 查询用户日志
		authGroup.GET("log", userController.UserLog)
		// 删除一个用户
		authGroup.DELETE("delete", userController.UserDelete)
		// 更新一个用户
		authGroup.PUT("update", userController.UserUpdate)
	}
}
