package model

// QSO结构体
type QSO struct {
	Call       string
	QsoDate    string
	TimeOn     string
	TimeOff    string
	Band       string
	Frequency  string
	Mode       string
	RstSent    string
	RstRcvd    string
	Dxcc       string
	Cqz        string
	Ituz       string
	Cont       string
	Gridsquare string
}

type Log struct {
	ID          int     `json:"id"`
	Date        string  `json:"date"`
	EnDate      string  `json:"endate"`
	ToSign      string  `json:"tosign"`
	FromSign    string  `json:"fromsign"`
	Frequency   string  `json:"frequency"`
	Band        string  `json:"band"`
	Method      string  `json:"method"`
	ToSignal    string  `json:"tosignal"`
	FromSignal  string  `json:"fromsignal"`
	ToPower     string  `json:"topower"`
	FromPower   string  `json:"frompower"`
	ToAntenna   string  `json:"toantenna"`
	FromAntenna string  `json:"fromantenna"`
	ToDevice    string  `json:"todevice"`
	FromDevice  string  `json:"fromdevice"`
	ToQTH       string  `json:"toqth"`
	FromQTH     string  `json:"fromqth"`
	Duration    string  `json:"duration"`
	Content     string  `json:"content"`
	Country     string  `json:"country"`
	FromCountry string  `json:"fromcountry"`
	Address     Address `json:"address"`
	UserId      int     `json:"userid"`
}

type Address struct {
	Id            int    `json:"id"`
	Name          string `json:"name"`
	Country       string `json:"country"`
	Prefix        string `json:"prefix"`
	Adif          string `json:"adif"`
	CQzone        string `json:"cqzone"`
	Ituzone       string `json:"ituzone"`
	Continent     string `json:"continent"`
	Latitude      string `json:"latitude"`
	Longitude     string `json:"longitude"`
	Gmtoffset     string `json:"gmtoffset"`
	ExactCallSign string `json:"exactcallsign"`
}
