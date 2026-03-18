package yaml

import (
	"database/sql"
	"fmt"
	"gopkg.in/yaml.v3"
	"log"
	"os"
	"sync"
)

var (
	config     Config
	configOnce sync.Once
)

type Config struct {
	Hamlog struct {
		Port                   int    `yaml:"port"`
		Sm2PublicKey           string `yaml:"sm2_public_key"`
		Sm2PrivateKey          string `yaml:"sm2_private_key"`
		Sm2CompressedPublicKey string `yaml:"sm2_compressed_public_key"`
		AdminPass              string `yaml:"adminpass"`
	} `yaml:"hamlog"`

	Mysql struct {
		Url      string `yaml:"url"`
		UserName string `yaml:"username"`
		PassWord string `yaml:"password"`
		DbName   string `yaml:"dbname"`
		Port     int    `yaml:"port"`
	}
}

func initConfig() {
	configOnce.Do(func() {
		loadedConfig, err := loadConfig("config.yaml")
		if err != nil {
			log.Fatalln("配置文件不存在", err)
		}
		config = *loadedConfig
	})
}

func initDatabase() (*sql.DB, error) {
	dburl := config.Mysql.Url
	dbuser := config.Mysql.UserName
	dbpass := config.Mysql.PassWord
	dbname := config.Mysql.DbName
	dbport := config.Mysql.Port

	DB, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", dbuser, dbpass, dburl, dbport, dbname))
	if err != nil {
		log.Println("数据库连接失败", err)
		return nil, err
	}

	err = DB.Ping()
	if err != nil {
		log.Println("数据库Ping失败", err)
		return nil, err
	}

	return DB, nil
}

func GetConfig() Config {
	initConfig()
	return config
}

func GetDatabase() (*sql.DB, error) {
	initConfig()
	return initDatabase()
}

func loadConfig(filename string) (*Config, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var config Config
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
