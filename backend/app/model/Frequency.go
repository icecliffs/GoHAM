package model

type Frequency struct {
	ID                   int    `json:"id"`
	Name                 string `json:"name"`
	Notes                string `json:"notes"`
	Type                 string `json:"type"`
	Receive_Downlink     string `json:"receive_downlink"`
	Frequency_Difference string `json:"frequency_difference"`
	Transmit_Uplink      string `json:"transmit_uplink"`
	Subsone              string `json:"subsone"`
	Addate               string `json:"addate"`
	UserId               int    `json:"userid"`
}
