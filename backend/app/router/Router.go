package router

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/controllers"
	"hamlog/app/middleware"
)

func InitRouter(r *gin.Engine) {
	// 用户路由
	UserRouter(r)
	// 日志路由
	LogRouter(r)
	// 频率路由
	FrequencyRouter(r)
	// QSL
	QSLRouter(r)
	// 首页大屏路由
	DisplayController := &controllers.DisplayController{}
	r.Use(middleware.JWTAuth())
	r.GET("/api/v1/display", DisplayController.DisplayScreen)
}
