package model

type QSL struct {
	Id         int    `json:"id"`
	UserId     int    `json:"user_id"`
	Url        string `json:"url"`
	FileName   string `json:"file_name"`
	UploadTime string `json:"upload_time"`
}
