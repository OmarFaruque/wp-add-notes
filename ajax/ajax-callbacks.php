<?php
if ( ! defined( 'RESPONSIVESTICKYNOTES_VERSION' ) ) exit; // Exit if accessed directly

//ACTIONS
add_action( 'wp_ajax_responsivestickynotes_new', 					'responsivestickynotes_new_callback' );
add_action( 'wp_ajax_responsivestickynotes_update', 				'responsivestickynotes_update_callback' );
add_action( 'wp_ajax_responsivestickynotes_update_elementchain', 	'responsivestickynotes_update_elementchain_callback' );
add_action( 'wp_ajax_responsivestickynotes_get', 					'responsivestickynotes_get_callback' );
add_action( 'wp_ajax_nopriv_responsivestickynotes_get', 			'responsivestickynotes_get_callback' );
add_action( 'wp_ajax_responsivestickynotes_fetchall', 			'responsivestickynotes_fetchall_callback' );
add_action( 'wp_ajax_nopriv_responsivestickynotes_fetchall', 		'responsivestickynotes_fetchall_callback' );
add_action( 'wp_ajax_responsivestickynotes_delete', 				'responsivestickynotes_delete_callback' );
add_action( 'wp_ajax_responsivestickynotes_update_color', 		'responsivestickynotes_update_color_callback' );




//add a new note and return the id
function responsivestickynotes_new_callback() {
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	if (!RESPONSIVESTICKYNOTES_note::can_edit()) wp_die();
	$post_id = (int) $_POST['id'];
	$page_id = (int) $_POST['page'];
	$v_name = $_POST['v_name'];
	$current_time = $_POST['current_time'];

	$elementChain = sanitize_text_field($_POST['element_chain']);
	//change draft post to publish status
	$my_post = array(
			'ID'           => $post_id,
			'post_status' => 'publish'
	);
	wp_update_post( $my_post );
	update_post_meta($post_id, RESPONSIVESTICKYNOTES_note::element_chain, $elementChain);
	update_post_meta($post_id, RESPONSIVESTICKYNOTES_note::page_id, $page_id);

	//Omar 
	if(!empty($v_name)) update_post_meta( $post_id, 'v_name', $v_name);
	if(!empty($current_time)) update_post_meta( $post_id, 'current_time', $current_time);
 	//create new draft note
	$nextId = RESPONSIVESTICKYNOTES_note::get_next_ID();
	$title = RESPONSIVESTICKYNOTES_note::get_tooltip($post_id);
	$admin_url = RESPONSIVESTICKYNOTES_note::admin_url($post_id);
	$out = array('tooltip' => $title, 'nextId' => $nextId, 'admin_url'=>$admin_url);
	echo json_encode($out);
	wp_die();
}

//update note contents
function responsivestickynotes_update_callback() {
	if (!RESPONSIVESTICKYNOTES_note::can_edit()) wp_die();
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	echo (RESPONSIVESTICKYNOTES_note::update_post((int) $_POST['id'], $_POST['content']));
	wp_die();
}

//update note element chain
function responsivestickynotes_update_elementchain_callback() {
	if (!RESPONSIVESTICKYNOTES_note::can_edit()) wp_die();
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	$id = (int)$_POST['id'];
	$elementChain = sanitize_text_field($_POST['elementchain']);
	update_post_meta($id, RESPONSIVESTICKYNOTES_note::element_chain, $elementChain);
	wp_die();
}

//fetch the content for a single note, by unique ID
function responsivestickynotes_get_callback() {
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	$id = (int)$_POST['id'];
	$post = get_post($id);
	echo esc_textarea($post->post_content);
	wp_die();
}

//fetch all notes
function responsivestickynotes_fetchall_callback() {
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	$ids = array();
	foreach ($_POST["ids"] as $id) {
		$ids[] = (int) $id;
	}
	$out = RESPONSIVESTICKYNOTES_note::get_notes($ids);
	echo(json_encode($out));
	wp_die();
}

//delete a note
function responsivestickynotes_delete_callback() {
	if (!RESPONSIVESTICKYNOTES_note::can_edit()) wp_die();
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	$id=(int) $_POST['id'];
	RESPONSIVESTICKYNOTES_note::delete_note($id);
	wp_die();
}

//set color
function responsivestickynotes_update_color_callback() {
	if (!RESPONSIVESTICKYNOTES_note::can_edit()) wp_die();
	check_ajax_referer( 'myajax-post-note-nonce', 'security' );
	$id=(int) $_POST['id'];
	$color = sanitize_text_field($_POST['color']);
	$bgcolor = sanitize_text_field($_POST['bgcolor']);
	update_post_meta($id, RESPONSIVESTICKYNOTES_note::color, $color);
	update_post_meta($id, RESPONSIVESTICKYNOTES_note::bgcolor, $bgcolor);
	wp_die();
}