import {Component,type ReactNode} from 'react'
/** Keep navigation and retry UI alive even when a model or optional window view fails. */
export class SceneBoundary extends Component<{children:ReactNode;onError?():void;resetKey?:string},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return{failed:true}}
 componentDidCatch(){this.props.onError?.()}
 componentDidUpdate(previous:{resetKey?:string}){if(this.state.failed&&previous.resetKey!==this.props.resetKey)this.setState({failed:false})}
 render(){return this.state.failed?null:this.props.children}
}
