<?php
if ( ! defined( 'RESPONSIVESTICKYNOTES_VERSION' ) ) exit; // Exit if accessed directly

//ACTIONS
add_action('admin_menu', 'responsivestickynotes_plugin_menu' );
add_action('admin_init', 'responsivestickynotes_admin_init');
add_action('admin_post_nopriv_export_csv_file',[RESPONSIVESTICKYNOTES_note::class,'export_csv']);
add_action('admin_post_export_csv_file',[RESPONSIVESTICKYNOTES_note::class,'export_csv']);

function responsivestickynotes_admin_init(){
	register_setting( 'responsivestickynotes_options_group', 'responsivestickynotes_options', 'responsivestickynotes_options_validate' );
	add_settings_section('responsivestickynotes_main', 'Main Settings', 'responsivestickynotes_section_text', 'responsivestickynotes');
	add_settings_field('responsivestickynotes_text_string', 'responsivestickynotes Text Input', 'responsivestickynotes_setting_string', 'responsivestickynotes', 'responsivestickynotes_main');
	//Adding the custom style
	wp_enqueue_style( 'responsivestickynotes_admin_styles', plugins_url('/css/responsive-notes-admin.css', __DIR__ ) );
}
function responsivestickynotes_plugin_menu() {
	add_menu_page( "Sticky Notes", "Custom Notes", "read", RESPONSIVESTICKYNOTES_note::slug, "responsivestickynotes_display_admin_page", 'dashicons-list-view', 90 );
}
class responsivestickynotes_List_Table extends WP_List_Table_copy {
	function __construct(){
		global $status, $page;
		//Set parent defaults
		parent::__construct( array(
				'singular'  => 'Responsive Sticky Note',     //singular name
				'plural'    => 'Responsive Sticky Notes',    //plural name
				'ajax'      => false        //does this table support ajax?
		));
	}
	function column_default($item, $column_name){
		return $item[$column_name];
	}

	
	
	function column_name($item){
		//Build row actions
		$actions = array(
			'edit'      => sprintf('<a href="?page=%s&action=%s&id=%s">Edit</a>',$_REQUEST['page'],'edit',$item['id']),
			'delete'    => sprintf("<a onclick='return confirm(\"".__('Delete this note?','responsive-sticky-notes')."\")' href=\"?page=%s&action=%s&id=%s\">Delete</a>", $_REQUEST['page'],'delete',$item['id']),
		);
		//Return the title contents
		$name = $item['name'];
		return sprintf('%1$s %2$s',
				/*$1%s*/ $name,
				/*$2%s*/ $this->row_actions($actions)
				);
	}
	function column_cb($item){
		return sprintf(
				'<input type="checkbox" name="%1$s[]" value="%2$s" />',
				/*$1%s*/ $this->_args['singular'],  //Let's simply repurpose the table's singular label
				/*$2%s*/ $item['id']                //The value of the checkbox should be the record's id
				);
	}
	function column_delete($item){
		return sprintf("<a onclick='return confirm(\"".__('Delete this note?','responsive-sticky-notes')."\")'
						href=\"?page=%s&action=%s&id=%s\">Delete</a>", $_REQUEST['page'],'delete',$item['id']
				);
	}
	function get_columns(){
		$columns = array(
				'cb'        => '<input type="checkbox" />', //Render a checkbox instead of text
				'index'		=> __('Id','responsive-sticky-notes'),
				'name'     	=> __('Name', 'responsive-sticky-notes'),
				'page' 		=> __('Post / Page', 'responsive-sticky-notes'),
				'created'   => __('Created', 'responsive-sticky-notes'),
				'delete'	=> __('','responsive-sticky-notes'),
		);
		return $columns;
	}
	function get_sortable_columns() {
		$sortable_columns = array(
				'index'		=>	array('index',false),
				'name'      =>  array('name',false),     //true means it's already sorted
				'page'      =>  array('page',false),
				'created'   =>  array('created',false),
		);
		return $sortable_columns;
	}
	//this is unused, the actions are defined in column_name(), where the ID is availale
	function get_bulk_actions() {
		$actions = array(
				'delete'    => 'Delete'
		);
		return $actions;
	}
	function process_bulk_action() {
		if (isset($_REQUEST['responsivestickynote'])) {
			$responsivestickynotes = $_REQUEST['responsivestickynote'];
			if( 'delete'===$this->current_action() ) {
				foreach ($responsivestickynotes as $responsivestickynote ) {
					RESPONSIVESTICKYNOTES_note::delete_note((int)$responsivestickynote);
				}
			}
		}
		if (isset($_REQUEST['id'])) {
			$id = $_REQUEST['id'];
			if( 'delete'===$this->current_action() ) {
				RESPONSIVESTICKYNOTES_note::delete_note((int)$id);
			}
		}
	}
	function prepare_items() {
		global $wpdb; //This is used only if making any database queries
		/**
		 * First, lets decide how many records per page to show
		 */
		$per_page = 5;
		$columns = $this->get_columns();
		$hidden = array();
		$sortable = $this->get_sortable_columns();
		$this->_column_headers = array($columns, $hidden, $sortable);
		$this->process_bulk_action();
		$data = RESPONSIVESTICKYNOTES_note::get_notes(NULL, false);
		function usort_reorder($a,$b){
			$orderby = (!empty($_REQUEST['orderby'])) ? $_REQUEST['orderby'] : 'name'; //If no sort, default to title
			$order = (!empty($_REQUEST['order'])) ? $_REQUEST['order'] : 'asc'; //If no order, default to asc
			if(is_numeric($a[$orderby]) && is_numeric($b[$orderby])){
				$result = $a[$orderby]<$b[$orderby];
			} else {
				$result = strcmp($a[$orderby], $b[$orderby]); //Determine sort order
			}
			return ($order==='asc') ? $result : -$result; //Send final sort direction to usort
		}
		usort($data, 'usort_reorder');
		$current_page = $this->get_pagenum();
		$total_items = count($data);
		$data = array_slice($data,(($current_page-1)*$per_page),$per_page);
		$this->items = $data;
		/**
		 * REQUIRED. We also have to register our pagination options & calculations.
		 */
		$this->set_pagination_args( array(
				'total_items' => $total_items,                  //WE have to calculate the total number of items
				'per_page'    => $per_page,                     //WE have to determine how many items to show on a page
				'total_pages' => ceil($total_items/$per_page)   //WE have to calculate the total number of pages
		) );
	}
	function editNote() {
		echo "here";
	}
}
function responsivestickynotes_section_text() {
	echo '<p>Main description of this section here.</p>';
}
function responsivestickynotes_setting_string() {
	$options = get_option('responsivestickynotes_options');
	echo "<input id='responsivestickynotes_text_string' name='responsivestickynotes_options[text_string]' size='40' type='text' value='{$options['text_string']}' />";
}
function responsivestickynotes_options_validate($plugin_options) {
	echo "validated!";
	wp_die();
	return $plugin_options;
}
function responsivestickynotes_display_admin_page() {
	global $wpdb;
	//Create an instance of our package class...
	$listTable = new responsivestickynotes_List_Table();
	//Fetch, prepare, sort, and filter our data...
	?>
	<!-- Adding button for exporting csv file -->
	<br>
	<form method="post" id="download_form" action="<?php echo esc_url( admin_url('admin-post.php') ); ?>">
		<input type="hidden" name="action" value="export_csv_file">
		<input type="submit" id="export_csv" name="export_csv" class="button-primary" value="Export Notes (CSV File)" />
	</form>
	<form method="post" id="search-form" action="">
		<input type="search" name="search-custom-notes" id="search-custom-notes" placeholder="&#9;Search&hellip;">
		<input type="submit" id="search-notes" name="search" class="button-primary" value="&#128269; Search"/>
	</form>
	<br>
	<?php
	$action = null;
	if (isset($_REQUEST['action'])) {
		$action = $_REQUEST['action'];
	}
	if (isset($_REQUEST['submit'])) {
		$action = 'update';
	}
	?>
	<?php
	if ($action == 'update') {
		if (isset($_REQUEST['name']) && isset($_REQUEST['content'])) { //form resubmission issue
			$name = trim(sanitize_text_field($_REQUEST['name']));
			$id = (int) ($_REQUEST['id']);
			$content = $_REQUEST['content'];
			RESPONSIVESTICKYNOTES_note::update_post($id, $content, $name);
		}
	}
	// position setting
	if(isset($_POST['apply-position']) ) {
		update_option( 'pix-to-pos-setting', $_POST['pix-position']);
		$pos_new=$_POST['pix-position'];?>
		<div id="alert-message-pos">
			<div id="alert-message">New Position of Button Saved</div>
			<div id="position">New Position:<?php echo $pos_new?></div>
		</div>
		<?php
	}
	// editing a single content
	if ($action == 'edit') {
		if (isset($_REQUEST['id'])) {
			$id = (int) $_REQUEST['id'];
			$post = get_post($id);
			$title = $post->post_title;
			if (strpos($title, 'untitled') !== FALSE) {
				$title=RESPONSIVESTICKYNOTES_note::default_title;
			}
			$title = esc_attr(__($title, "responsive-sticky-notes"));
			$settings = array(
				'textarea_name' => 'content',
				'wpautop' => true,
				'media_buttons' => false,
				'tinymce' =>array(
					'toolbar1'=> 'bold italic underline | alignleft aligncenter alignright | bullist numlist',
					'toolbar2'=> false,
				),
				'quicktags' => false,
			);
			?>
			<div class="wrap">
				<div id="icon-edit" class="icon32"></div>
				<h1><?php echo esc_html( __( 'Edit Sticky Note', 'responsive-sticky-notes' ) );?></h1>
				<div style="height: 10px"></div>
				<form method="post" action="<?php echo esc_url( add_query_arg( array('page' => 'responsive-sticky-notes', 'action' => 'update', 'id'=>$id), menu_page_url( 'responsivestickynotes', false ) ) ); ?>">
					<div id="titlediv">
						<div id="titlewrap">
							<input type="text" name="name" style="width:100%" value="<?php echo $title; ?>" id="title" spellcheck="true" autocomplete="off" /><br>
						</div>
					</div>
					<?php wp_editor($post->post_content,'content',$settings);?>
					<input type="hidden" name="id" value = "<?php echo $id;?>">
					<?php submit_button('',"submit"); ?>
				</form>
			</div>
		<?php
		}
	}
	else {
		$listTable->prepare_items();
		?>
    	<div class="wrap">
        	<div id="icon-users" class="icon32"><br/></div>
        	<h2>Add Notes</h2>
        <!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
        	<form id="responsivestickynotes-list-table" method="get">
            <!-- For plugins, we also need to ensure that the form posts back to our current page -->
            	<input type="hidden" name="page" value="<?php echo $_REQUEST['page'] ?>" />
            <!-- Now we can render the completed list table -->
            	<?php $listTable->display() ?>
        	</form>
		</div>
		<br>
		<!-- to display the position options available to the user -->
		<form method="post" action="">
			<div class="pix-position-add-note">
				Select the position to display the add note button to :
				<div class="dropdownGroup">
				<select name="pix-position" id="pix-position">
					<option value="position-selection">--Choose the position--</option>
					<option value="Top-Left" id="pix-to-top-left">Top-Left</option>
					<option value="Top-Middle" id="pix-to-top-middle">Top-Middle</option>
					<option value="Top-Right" id="pix-to-top-right">Top-Right</option>
					<option value="Bottom-Left" id="pix-to-bottom-left">Bottom-Left</option>
					<option value="Bottom-Middle" id="pix-to-bottom-middle">Bottom-Middle</option>
					<option value="Bottom-Right" id="pix-to-bottom-right">Bottom-Right</option>
					<option value="Left-Middle" id="pix-to-left-middle">Left-Middle</option>
					<option value="Right-Middle" id="pix-to-right-middle">Right-Middle</option>
				</select>
				</div>
				<input type="submit" id="apply-position" name="apply-position" class="button-primary" value="Apply"/>
			</div>
		</form>
		<input type="submit" onclick="helpButton()" id="help-for-user" class="button-primary" value="Help"/>
		<div id="help-content-block">
			<span id="close-button" onclick="closehelpButton()">&times;</span>
			<div id="help-content">
				<h3>Sticky Notes - Help</h3>
				<br>
				<p>This plugin lets you add 'sticky' notes to any post or non-admin page. The notes are attached to HTML elements within the page, so are ideal for text annotations or to add extra information to images, etc., and will move with responsive layout changes so they never vanish off the edge of the screen.
				</p>
				<p>Sticky notes can be added to any post or non-admin page. To add a note, leave the admin area and go to the page you want to add a note to. Then click the 'Add Sticky Note' button in the top admin bar, and move the cursor over the page. As you move the cursor, page elements are highlighted with an outline. Click again to add a note at this position.</p>
				<p>Notes are attached to the beginning of a page element, i.e. at the top left corner of a &ltp&gt;, &ltdiv&gt;, etc. A note can be attached to anything on a page.</p>
				<p>Once you have added a note, click it to open it. Then type text as required - it is saved as you type.
				<p>To move a note, click and drag it to another position on the page. If the note is open, click and drag from top, between the Close and Menu icons. The The page will scroll automatically when the note is close to an edge (you may need to move the cursor a little to get the page to scroll).</p>
				<p>To change the note color, delete the note, or go to the edit page, click the 'menu' icon in the top right corner.
				<p>The note 'tooltip' is set to the first few words of the note, unless the note has a title. To set a title, open the note menu then click the ... icon, to go to the note edit screen.</p>
				<p>If you delete a page element to which a note is attached, the note will 'float' to the top left of the window. This may also happen if you change an ID somewhere on the page. Floated notes can be dragged to any other page element, as normal.</p>
				<p>Notes are unique to the page you stick them on, so a note attached to a banner, footer or other site-wide element will only appear on one page. Notes cannot be moved between pages.</p>
			</div>
		</div>
		<script>
			function helpButton(){
				var block=document.getElementById('help-content-block');
				var content=document.getElementById('help-content');
				block.style.display="block";
				content.style.display="block";
			}
			function closehelpButton(){
				var block=document.getElementById('help-content-block');
				var content=document.getElementById('help-content');
				block.style.display="none";
				content.style.display="none";
			}
		</script>
    <?php
	}
}
