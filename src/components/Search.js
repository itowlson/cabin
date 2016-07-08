/*
  Copyright 2015 Skippbox, Ltd

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import Colors from 'styles/Colors';
import ClustersActions from 'actions/ClustersActions';
import SearchActions from 'actions/SearchActions';
import SearchEntitiesStore from 'stores/SearchEntitiesStore';
import EntitiesRoutes from 'routes/EntitiesRoutes';
import ListItem from 'components/commons/ListItem';
import ListHeader from 'components/commons/ListHeader';

const { PropTypes } = React;
const {
  View,
  StyleSheet,
  ScrollView,
  DeviceEventEmitter,
} = ReactNative;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 20,
  },
});

export default class Search extends Component {

  static propTypes = {
    cluster: PropTypes.instanceOf(Immutable.Map).isRequired,
    entities: PropTypes.instanceOf(Immutable.Map),
  }

  static defaultProps = {
    entities: Immutable.fromJS({
      pods: [], services: [], replications: [],
    }),
  }

  constructor() {
    super();
    this.query = '';
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    this.searchListener = DeviceEventEmitter.addListener('search:change', this.handleSearch.bind(this));
    SearchEntitiesStore.listen(this.onChange);
    ClustersActions.fetchClusterEntities(this.props.cluster);
    SearchActions.searchEntities({cluster: this.props.cluster, query: ''});
  }

  componentWillUnmount() {
    this.searchListener.remove();
    SearchEntitiesStore.unlisten(this.onChange);
  }

  render() {
    const result = SearchEntitiesStore.getResult({cluster: this.props.cluster, query: this.query});
    const renderItems = (e, i) => this.renderItem(e, i);
    const services = result.get('services', Immutable.List()).map(renderItems);
    const pods = result.get('pods', Immutable.List()).map(renderItems);
    const replications = result.get('replications', Immutable.List()).map(renderItems);
    return (
      <View style={styles.container}>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {pods.size > 0 && <ListHeader title="Pods"/>}
          {pods}
          {services.size > 0 && <ListHeader title="Services"/>}
          {services}
          {replications.size > 0 && <ListHeader title="Replication Controllers"/>}
          {replications}
        </ScrollView>
      </View>
    );
  }

  renderItem(entitiy, key) {
    return (
      <ListItem
        key={key}
        title={entitiy.getIn(['metadata', 'name'])}
        showArrow={true}
        onPress={() => this.handlePress(entitiy)}
      />
    );
  }

  onChange() {
    this.forceUpdate();
  }

  handlePress(entity) {
    this.props.navigator.push(EntitiesRoutes.getEntitiesShowRoute(entity));
  }

  handleSearch({text}) {
    this.query = text;
    SearchActions.searchEntities({cluster: this.props.cluster, query: text});
  }
}
