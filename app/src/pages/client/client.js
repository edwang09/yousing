import React, { Component } from 'react'
import Clientfooter from './client-footer'
import Clientheader from './client-header'
import Clientcurrent from './client-current'
import Clientcontrol from './client-control'
import Cliententry from './client-entry'
import Clientsearch from './client-search'
import axios from 'axios'
import { connect } from "react-redux";
import PropTypes from 'prop-types'
import { loadModal } from "../../actions/modalActions";
import classNames from 'classnames'

class Client extends Component {
  constructor(props) {
    super(props);
    this.top = React.createRef();
    this.state = {
      searchbarOpen:true,
      socket: "off",
      roomid:"",
      search:"",
      currenttab:"current"
    };
  }
  opensearchbar = () => e =>{
    this.setState({ searchbarOpen : true })
  }
  controlToggle = () => e =>{
    if(this.state.controlOpen){
      this.setState({ 
        controlOpen : false, 
        currenttab:"current"
      })
    }else{
      this.setState({ 
        controlOpen : true, 
        currenttab:"control"
      })
    }
  }
  closesearchbar = () => e =>{
    this.setState({ searchbarOpen : false })
  }
  tabChange = (tab) => e =>{
    this.setState({currenttab : tab})
    console.log(tab)
  }
  roomidChange = () => e =>{
    this.setState({roomid : e.target.value})
  }
  roomidSubmit= () => e => {
    e.preventDefault()
    console.log(this.state.roomid)
    axios.post("http://localhost:8080/api/karaokes/room",{
      roomid:this.state.roomid
    }).then(res=>{
      console.log(res)
      this.setState({
        currentroom: res.data
      })
      this.connection = new WebSocket((process.env.NODE_ENV === "production"? "ws://yousing.herokuapp.com" : "ws://localhost:8080"));
      console.log(this.connection)
      this.connection.onopen = evt => { 
        this.setState({socket: "on"})
        this.connection.send(JSON.stringify({
          "type":"register",
          "role":"client",
          "roomid":res.data.roomid
        }))
        setInterval(()=>{
          this.connection.send("ping")
        },30000)
      };
      this.connection.onmessage = evt => {
        if (evt.data && evt.data!=="pong") {
          const result = JSON.parse(evt.data)
          console.log(result)
          switch (result.type) {
            case "register":
              this.setState({clientID: result.clientID})
              break;
            case "push":
              this.setState({currentroom:result.data})
              break;
            default:
              break;
          }
        }
      };
      this.connection.onclose = evt => {
        this.setState({socket: "off"})
      };
      this.connection.onerror = evt => {
        this.setState({socket: "error"})
        console.log("error recieved")
        console.log(evt)
      };
    }).catch(err=>{
      console.log(err)
    })
  }
  sendsocket = (msg) =>{
    this.connection.send(msg)
  }
  // componentDidMount(){
  //   axios.post("http://localhost:8080/api/karaokes/room",{
  //     roomid:"9761353"
  //   }).then(res=>{
  //     console.log(res)
  //     this.setState({
  //       currentroom: res.data
  //     })
  //   }).catch(err=>{
  //     console.log(err)
  //   })
  // }
  render() {
    return (
      <div className = "karaoke-client">
        <Clientheader opensearchbar={this.opensearchbar}/>
        <Clientfooter tabChange={this.tabChange} currenttab={this.state.currenttab}/>
        <div>
          {this.state.currentroom && 
            <div className = "content">
              <Clientcurrent currentroom={this.state.currentroom} socket={this.state.socket} clientID={this.state.clientID} currenttab={this.state.currenttab}/>
              <Clientcontrol currentroom={this.state.currentroom} sendsocket={this.sendsocket} clientID={this.state.clientID} currenttab={this.state.currenttab}/>
              <div className="divider"></div>
              <div className={classNames("searchbar",{"searchbar-open":this.state.searchbarOpen})}>
                <Clientsearch closesearchbar={this.closesearchbar} currentroom={this.state.currentroom} loadModal={this.props.loadModal}/>
              </div>
              <div onClick={this.controlToggle()} className={classNames("control-button",{"control-open":this.state.controlOpen})}>
                <i className="fas fa-gamepad"></i>
              </div>
            </div>
          }
          {!this.state.currentroom && 
            <Cliententry roomidSubmit={this.roomidSubmit} roomidChange={this.roomidChange} roomid={this.state.roomid}/>
          }
        </div>
      </div>
    )
  }
}
Client.propTypes = {
  loadModal: PropTypes.func.isRequired
};
export default connect(
  null,
  {
    loadModal,
  }
)(Client);