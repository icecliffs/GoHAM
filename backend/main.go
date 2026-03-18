package main

import (
	"embed"
	"fmt"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"hamlog/app/config/yaml"
	"hamlog/app/router"
	"html/template"
	"io/fs"
	"log"
	"net/http"
)

//go:embed static
var embedFs embed.FS

func main() {
	// 显示LOGO
	fmt.Println("  _    _          __  __ _      ____   _____ \n | |  | |   /\\   |  \\/  | |    / __ \\ / ____|\n | |__| |  /  \\  | \\  / | |   | |  | | |  __ \n |  __  | / /\\ \\ | |\\/| | |   | |  | | | |_ |\n | |  | |/ ____ \\| |  | | |___| |__| | |__| |\n |_|  |_/_/    \\_\\_|  |_|______\\____/ \\_____|\n                                             \nAuthor: IceCliffs (https://github.com/icecliffs)")
	fmt.Println("")
	// 启动Web
	r := gin.Default()
	// 启动前端
	templ := template.Must(template.New("").ParseFS(embedFs, "static/*.html"))
	r.SetHTMLTemplate(templ)
	fe, _ := fs.Sub(embedFs, "static")
	r.StaticFS("/static", http.FS(fe))
	r.GET("/", func(context *gin.Context) {
		context.HTML(http.StatusOK, "index.html", gin.H{})
	})
	// 设置静态目录
	r.Static("/upload", "./upload")
	r.Static("/assets", "./assets")
	r.Static("/output", "./output")
	// 加载路由
	router.InitRouter(r)
	log.Print("HAMLOG将启动在端口 http://127.0.0.1:", yaml.GetConfig().Hamlog.Port)
	addr := fmt.Sprintf(":%d", yaml.GetConfig().Hamlog.Port)
	s := &http.Server{
		Addr:    addr,
		Handler: r,
	}
	err := s.ListenAndServe()
	if nil != err {
		log.Println("WEB服务启动失败", err)
	}
}

// 打包：go build goham
